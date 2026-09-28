import type { CabinetClinic } from "@/shared/api/cabinet";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-lg font-extrabold">{title}</h3>
      <div className="text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function textOrNull(value?: string | null) {
  const v = value?.trim();
  return v ? v : null;
}

export function ClinicPreview({ clinic }: { clinic: CabinetClinic }) {
  const history = textOrNull(clinic.historyRu) || textOrNull(clinic.historyEn);
  const mission = textOrNull(clinic.missionRu) || textOrNull(clinic.missionEn);
  const advantages = textOrNull(clinic.advantagesRu) || textOrNull(clinic.advantagesEn);
  const why = textOrNull(clinic.whyChooseRu) || textOrNull(clinic.whyChooseEn);

  return (
    <div className="soft-card overflow-hidden rounded-[1.75rem] bg-white">
      <div className="h-28" style={{ background: clinic.coverColor || "#1570ef" }} />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-start gap-4">
          {clinic.logoUrl ? (
            <img
              src={clinic.logoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl border border-line bg-white object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-extrabold text-white">
              {(clinic.nameRu || clinic.nameEn).slice(0, 1)}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-extrabold">{clinic.nameRu || clinic.nameEn}</h2>
            {clinic.shortName ? <p className="text-sm text-muted">{clinic.shortName}</p> : null}
            <p className="mt-1 text-sm text-muted">
              {clinic.city}
              {clinic.foundedYear ? ` · осн. ${clinic.foundedYear}` : ""}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink">
          {clinic.descriptionRu || clinic.descriptionEn}
        </p>

        {clinic.specialties?.length ? (
          <div className="flex flex-wrap gap-2">
            {clinic.specialties.map((s) => (
              <span key={s.id || s.slug} className="chip">
                {s.nameRu || s.nameEn}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2 text-sm text-muted">
          <p>{clinic.addressRu || clinic.addressEn}</p>
          <p>{clinic.phone}</p>
          <p>{clinic.email}</p>
          {clinic.website ? <p>{clinic.website}</p> : null}
        </div>

        <Block title="История">{history}</Block>
        <Block title="Миссия">{mission}</Block>
        <Block title="Преимущества">
          {advantages ? <pre className="whitespace-pre-wrap font-sans">{advantages}</pre> : null}
        </Block>

        {clinic.chiefDoctorName ? (
          <Block title="Главный врач">
            <p className="font-bold text-ink">{clinic.chiefDoctorName}</p>
            <p>{clinic.chiefDoctorRoleRu || clinic.chiefDoctorRoleEn}</p>
          </Block>
        ) : null}

        {clinic.doctors?.length ? (
          <Block title="Специалисты">
            <ul className="space-y-2">
              {clinic.doctors.map((d) => (
                <li key={d.id} className="font-semibold text-ink">
                  {d.nameRu || d.nameEn}
                  {d.roleRu || d.roleEn ? (
                    <span className="font-normal text-muted"> — {d.roleRu || d.roleEn}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {clinic.equipment?.length ? (
          <Block title="Оборудование">
            <ul className="list-disc pl-5">
              {clinic.equipment.map((e) => (
                <li key={e.id}>{e.nameRu || e.nameEn}</li>
              ))}
            </ul>
          </Block>
        ) : null}

        {clinic.certificates?.length ? (
          <Block title="Сертификаты">
            <ul className="list-disc pl-5">
              {clinic.certificates.map((c) => (
                <li key={c.id}>
                  {c.nameRu || c.nameEn}
                  {c.year ? ` (${c.year})` : ""}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {clinic.photos?.length ? (
          <Block title="Фотографии">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {clinic.photos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.altRu || p.altEn || ""}
                  className="aspect-video rounded-xl object-cover"
                />
              ))}
            </div>
          </Block>
        ) : null}

        <Block title="Почему выбирают">{why}</Block>

        {clinic.branches?.length ? (
          <Block title="Филиалы">
            <ul className="space-y-1">
              {clinic.branches.map((b) => (
                <li key={b.id} className="font-semibold text-ink">
                  {b.nameRu || b.nameEn} · {b.city}
                </li>
              ))}
            </ul>
          </Block>
        ) : (
          <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm">
            Филиалы не добавлены — без них модерация недоступна.
          </p>
        )}
      </div>
    </div>
  );
}
