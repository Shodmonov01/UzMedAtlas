import type { CabinetClinic } from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { BranchMap } from "@/shared/ui/BranchMap";
import { PhotoCarousel } from "@/shared/ui/PhotoCarousel";

function text(value?: string | null) {
  const v = value?.trim();
  return v || null;
}

function lines(value?: string | null) {
  const raw = text(value);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-extrabold tracking-tight text-ink">{title}</h3>
      {children}
    </section>
  );
}

/** Preview mirrors the public `/clinics/$slug` page layout (§26 / §35). */
export function ClinicPreview({ clinic }: { clinic: CabinetClinic }) {
  const cover =
    clinic.photos?.[0]?.url ||
    clinic.branches?.[0]?.coverUrl ||
    null;
  const history = text(clinic.historyRu) || text(clinic.historyEn);
  const mission = text(clinic.missionRu) || text(clinic.missionEn);
  const advantagesRu = lines(clinic.advantagesRu);
  const advantages = advantagesRu.length ? advantagesRu : lines(clinic.advantagesEn);
  const why = text(clinic.whyChooseRu) || text(clinic.whyChooseEn);
  const popularRu = lines(clinic.popularServicesRu);
  const popular = popularRu.length ? popularRu : lines(clinic.popularServicesEn);
  const tourism = text(clinic.medicalTourismRu) || text(clinic.medicalTourismEn);
  const cityLabel = CITY_LABELS[clinic.city] || clinic.city;
  const mapBranch = (clinic.branches || []).find(
    (b) => b.lat != null && b.lng != null && Number.isFinite(b.lat) && Number.isFinite(b.lng),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-mint px-4 py-3 text-sm font-semibold text-primary">
        Предпросмотр публичной страницы — так клиника увидят посетители после публикации
      </div>

      <div className="space-y-8">
        <header className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-36px_rgba(31,41,55,0.45)]">
          <div
            className="relative min-h-[180px] bg-primary-deep"
            style={{
              background: cover
                ? undefined
                : `linear-gradient(135deg, ${clinic.coverColor || "#1570ef"}, #1849a9)`,
            }}
          >
            {cover ? (
              <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
            <div className="relative flex min-h-[180px] flex-col justify-end gap-3 p-5 md:p-6">
              <div className="flex flex-wrap items-end gap-3">
                {clinic.logoUrl ? (
                  <img
                    src={clinic.logoUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl border border-white/40 bg-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-xl font-extrabold text-white">
                    {(clinic.nameRu || clinic.nameEn).slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-white">
                  <p className="text-sm font-semibold text-white/75">
                    {cityLabel}
                    {clinic.foundedYear ? ` · с ${clinic.foundedYear}` : ""}
                    {clinic.responseHours ? ` · ответ ~${clinic.responseHours}ч` : ""}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
                    {clinic.nameRu || clinic.nameEn}
                  </h2>
                  {clinic.shortName ? (
                    <p className="mt-1 text-sm text-white/70">{clinic.shortName}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5 md:p-6">
            <p className="max-w-3xl text-sm leading-relaxed text-muted md:text-base">
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
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
              {clinic.languages?.length ? (
                <span className="uppercase tracking-wide">{clinic.languages.join(" · ")}</span>
              ) : null}
              {clinic.medicalTourism ? <span>Медтуризм</span> : null}
              {clinic.phone ? <span className="text-primary">{clinic.phone}</span> : null}
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-10">
            {clinic.photos?.length ? (
              <Section title="Фотографии">
                <PhotoCarousel
                  photos={clinic.photos.map((p) => ({
                    id: p.id,
                    url: p.url,
                    alt: p.altRu || p.altEn || "",
                  }))}
                />
              </Section>
            ) : null}

            {(history || mission) && (
              <Section title="О клинике">
                <div className="grid gap-4 md:grid-cols-2">
                  {history ? (
                    <div className="rounded-2xl border border-line bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">История</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{history}</p>
                    </div>
                  ) : null}
                  {mission ? (
                    <div className="rounded-2xl border border-line bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">Миссия</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{mission}</p>
                    </div>
                  ) : null}
                </div>
              </Section>
            )}

            {advantages.length ? (
              <Section title="Преимущества">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {advantages.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {why ? (
              <Section title="Почему выбирают">
                <p className="text-sm leading-relaxed text-muted">{why}</p>
              </Section>
            ) : null}

            {(text(clinic.developmentPlansRu) || text(clinic.developmentPlansEn)) && (
              <Section title="Планы развития">
                <p className="text-sm leading-relaxed text-muted">
                  {text(clinic.developmentPlansRu) || text(clinic.developmentPlansEn)}
                </p>
              </Section>
            )}

            {clinic.founderName ? (
              <Section title="Основатель">
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
                  {clinic.founderPhotoUrl ? (
                    <img
                      src={clinic.founderPhotoUrl}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-lg font-extrabold text-primary">
                      {clinic.founderName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-ink">{clinic.founderName}</p>
                    <p className="text-sm text-muted">
                      {clinic.founderRoleRu || clinic.founderRoleEn}
                    </p>
                    {(clinic.founderBioRu || clinic.founderBioEn) && (
                      <p className="mt-2 text-sm text-muted">
                        {clinic.founderBioRu || clinic.founderBioEn}
                      </p>
                    )}
                  </div>
                </div>
              </Section>
            ) : null}

            {clinic.achievements?.length ? (
              <Section title="Достижения">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {clinic.achievements.map((a) => (
                    <li
                      key={a.id || a.titleRu}
                      className="rounded-2xl border border-line bg-white p-4"
                    >
                      <p className="font-bold text-ink">{a.titleRu || a.titleEn}</p>
                      {(a.descriptionRu || a.descriptionEn) && (
                        <p className="mt-2 text-sm text-muted">
                          {a.descriptionRu || a.descriptionEn}
                        </p>
                      )}
                      {a.year ? <p className="mt-1 text-sm text-muted">{a.year}</p> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {clinic.technologies?.length ? (
              <Section title="Технологии и методики">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {clinic.technologies.map((t) => (
                    <li
                      key={t.id || t.nameRu}
                      className="rounded-2xl border border-line bg-white p-4"
                    >
                      <p className="font-bold text-ink">{t.nameRu || t.nameEn}</p>
                      {(t.descriptionRu || t.descriptionEn) && (
                        <p className="mt-2 text-sm text-muted">
                          {t.descriptionRu || t.descriptionEn}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {clinic.chiefDoctorName || clinic.leaders?.length ? (
              <Section title="Руководство">
                {clinic.chiefDoctorName ? (
                  <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
                    {clinic.chiefDoctorPhotoUrl ? (
                      <img
                        src={clinic.chiefDoctorPhotoUrl}
                        alt=""
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-lg font-extrabold text-primary">
                        {(clinic.chiefDoctorName || "?").slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-ink">{clinic.chiefDoctorName}</p>
                      <p className="text-sm text-muted">
                        {clinic.chiefDoctorRoleRu || clinic.chiefDoctorRoleEn}
                      </p>
                      {(clinic.chiefDoctorBioRu || clinic.chiefDoctorBioEn) && (
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {clinic.chiefDoctorBioRu || clinic.chiefDoctorBioEn}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                {clinic.leaders?.length ? (
                  <ul className={`grid gap-3 sm:grid-cols-2 ${clinic.chiefDoctorName ? "mt-3" : ""}`}>
                    {clinic.leaders.map((l) => (
                      <li key={l.id || l.name} className="rounded-2xl border border-line bg-white p-4">
                        <div className="flex gap-3">
                          {l.photoUrl ? (
                            <img src={l.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-sand text-sm font-extrabold text-muted">
                              {l.name.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-ink">{l.name}</p>
                            <p className="text-sm text-muted">{l.roleRu || l.roleEn}</p>
                            {(l.bioRu || l.bioEn) && (
                              <p className="mt-1 text-sm text-muted">{l.bioRu || l.bioEn}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Section>
            ) : null}

            {clinic.doctors?.length ? (
              <Section title="Специалисты">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {clinic.doctors.map((d) => (
                    <li key={d.id} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex gap-3">
                        {d.photoUrl ? (
                          <img
                            src={d.photoUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sand text-sm font-extrabold text-muted">
                            {(d.nameRu || d.nameEn).slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-ink">{d.nameRu || d.nameEn}</p>
                          <p className="text-sm text-muted">{d.roleRu || d.roleEn}</p>
                          {d.category ? (
                            <p className="mt-1 text-xs font-semibold text-primary">
                              категория: {d.category}
                            </p>
                          ) : null}
                          {d.experienceYears != null ? (
                            <p className="mt-1 text-xs font-semibold text-primary">
                              опыт {d.experienceYears} лет
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {(d.bioRu || d.bioEn) && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                          {d.bioRu || d.bioEn}
                        </p>
                      )}
                      {(d.certsRu || d.certsEn) && (
                        <p className="mt-2 text-sm text-muted">{d.certsRu || d.certsEn}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {popular.length ? (
              <Section title="Популярные услуги">
                <div className="rounded-2xl bg-mint px-4 py-3">
                  <ul className="space-y-1 text-sm text-ink">
                    {popular.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Section>
            ) : null}

            {clinic.equipment?.length ? (
              <Section title="Оборудование">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {clinic.equipment.map((e) => (
                    <li key={e.id} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex gap-3">
                        {e.photoUrl ? (
                          <img src={e.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        ) : null}
                        <div>
                          <p className="font-bold text-ink">{e.nameRu || e.nameEn}</p>
                          {e.manufacturer ? (
                            <p className="mt-1 text-xs font-semibold text-primary">{e.manufacturer}</p>
                          ) : null}
                          {(e.descriptionRu || e.descriptionEn) && (
                            <p className="mt-2 text-sm text-muted">
                              {e.descriptionRu || e.descriptionEn}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {clinic.certificates?.length ? (
              <Section title="Сертификаты и лицензии">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {clinic.certificates.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex gap-3">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        ) : null}
                        <div>
                          <p className="font-bold text-ink">{c.nameRu || c.nameEn}</p>
                          <p className="mt-1 text-sm text-muted">
                            {c.issuerRu || c.issuerEn}
                            {c.receivedAt ? ` · получен ${c.receivedAt}` : c.year ? ` · ${c.year}` : ""}
                            {c.validUntil ? ` · до ${c.validUntil}` : ""}
                          </p>
                          {c.fileUrl ? (
                            <a
                              href={c.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-sm font-bold text-primary"
                            >
                              Открыть файл
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {tourism ? (
              <Section title="Медицинский туризм">
                <p className="text-sm leading-relaxed text-muted">{tourism}</p>
              </Section>
            ) : null}

            {mapBranch && mapBranch.lat != null && mapBranch.lng != null ? (
              <Section title="Расположение">
                {(mapBranch.addressRu || mapBranch.addressEn) && (
                  <p className="text-sm text-muted">{mapBranch.addressRu || mapBranch.addressEn}</p>
                )}
                <div className="min-w-0 overflow-hidden">
                  <BranchMap
                    mode="view"
                    lat={mapBranch.lat}
                    lng={mapBranch.lng}
                    className="w-full max-w-full"
                  />
                </div>
              </Section>
            ) : null}

            <Section title="Филиалы">
              {(clinic.branches || []).length === 0 ? (
                <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm">
                  Филиалы не добавлены — без них модерация недоступна.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {clinic.branches!.map((b) => (
                    <article
                      key={b.id}
                      className="overflow-hidden rounded-2xl border border-line bg-white"
                    >
                      <div
                        className="h-24 bg-primary-soft"
                        style={
                          b.coverUrl
                            ? {
                                backgroundImage: `url(${b.coverUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      />
                      <div className="space-y-1 p-4">
                        <h4 className="font-extrabold">{b.nameRu || b.nameEn}</h4>
                        <p className="text-sm text-muted">
                          {CITY_LABELS[b.city] || b.city}
                          {b.phone ? ` · ${b.phone}` : ""}
                        </p>
                        <p className="text-sm text-muted">{b.addressRu || b.addressEn}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-4 lg:self-start">
            <div className="rounded-3xl bg-primary-deep p-5 text-white">
              <p className="text-sm text-white/70">Контакты</p>
              <p className="mt-3 text-lg font-bold">{clinic.phone}</p>
              {clinic.email ? <p className="mt-2 text-sm text-white/85">{clinic.email}</p> : null}
              {clinic.website ? (
                <p className="mt-2 truncate text-sm text-white/85">
                  {clinic.website.replace(/^https?:\/\//, "")}
                </p>
              ) : null}
              <div className="mt-4 space-y-1 text-sm text-white/80">
                {clinic.whatsapp ? <p>WhatsApp: {clinic.whatsapp}</p> : null}
                {clinic.telegram ? <p>Telegram: {clinic.telegram}</p> : null}
                {clinic.instagram ? <p>Instagram: {clinic.instagram}</p> : null}
                {clinic.youtube ? (
                  <a href={clinic.youtube} target="_blank" rel="noreferrer" className="block truncate hover:underline">
                    YouTube
                  </a>
                ) : null}
              </div>
              {clinic.coordinatorName ? (
                <div className="mt-5 border-t border-white/15 pt-4">
                  <p className="text-xs uppercase tracking-wide text-white/55">Координатор</p>
                  <p className="mt-1 font-bold">{clinic.coordinatorName}</p>
                  <p className="text-sm text-white/70">
                    {clinic.coordinatorRoleRu || clinic.coordinatorRoleEn}
                  </p>
                </div>
              ) : null}
              <p className="mt-4 text-sm text-white/60">Ответ около {clinic.responseHours} ч</p>
            </div>
            <div className="rounded-2xl border border-dashed border-line bg-sand/50 px-4 py-5 text-center text-sm text-muted">
              Форма заявки появится на публичной странице
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
