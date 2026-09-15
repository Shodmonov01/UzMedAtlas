import { prisma } from "./db";

export async function sendLeadEmails(options: {
  leadId: string;
  clinicEmail: string;
  clinicName: string;
  subject: string;
  body: string;
}) {
  const recipients = [options.clinicEmail];
  const platform = process.env.PLATFORM_NOTIFY_EMAIL;
  if (platform && platform !== options.clinicEmail) recipients.push(platform);

  for (const toAddress of recipients) {
    const status = process.env.SMTP_HOST ? "queued" : "logged";
    await prisma.emailLog.create({
      data: {
        leadId: options.leadId,
        toAddress,
        subject: options.subject,
        body: options.body,
        status,
      },
    });
  }
}

export function formatLeadEmail(input: {
  clinicName: string;
  fullName: string;
  country: string;
  phone: string;
  email?: string | null;
  contactMethod: string;
  arrival: string;
  source: string;
  specialty?: string | null;
  symptoms?: string | null;
  medicalNeed?: string | null;
  age?: number | null;
  gender?: string | null;
  duration?: string | null;
  forChild?: boolean;
  preferredHours?: string | null;
  utmSource?: string | null;
}) {
  const lines = [
    `New UzMedAtlas request for ${input.clinicName}`,
    "",
    `Patient: ${input.fullName}`,
    `Country: ${input.country}`,
    `Phone: ${input.phone}`,
    input.email ? `Email: ${input.email}` : null,
    `Preferred contact: ${input.contactMethod}`,
    input.preferredHours ? `Preferred hours: ${input.preferredHours}` : null,
    `Arrival: ${input.arrival}`,
    `Source: ${input.source}`,
    input.utmSource ? `Campaign: ${input.utmSource}` : null,
    input.specialty ? `Suggested specialty: ${input.specialty}` : null,
    input.forChild ? "The request is for a child." : null,
    input.age != null ? `Age: ${input.age}` : null,
    input.gender ? `Sex: ${input.gender}` : null,
    input.duration ? `Duration: ${input.duration}` : null,
    "",
    "Medical request:",
    input.symptoms || input.medicalNeed || "—",
    "",
    "Please contact the patient directly. This is not a confirmed appointment.",
  ];
  return lines.filter((line) => line !== null).join("\n");
}
