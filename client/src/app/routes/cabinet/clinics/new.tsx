import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { cabinetMe, createCabinetClinic } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { ClinicEditorForm } from "@/widgets/clinic-form/ClinicEditorForm";

export const Route = createFileRoute("/cabinet/clinics/new")({
  component: NewClinicPage,
});

function NewClinicPage() {
  const navigate = useNavigate();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data) return <p className="text-muted">Проверка сессии…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link to="/cabinet" className="text-sm font-bold text-primary hover:underline">
          ← Мои клиники
        </Link>

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_24px_60px_-36px_rgba(31,41,55,0.35)]">
          <div className="bg-gradient-to-br from-primary via-primary-hover to-primary-deep px-6 py-8 text-white md:px-8">
            <p className="text-sm font-semibold text-white/75">Шаг 1 из профиля</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Новая клиника</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
              Заполните базовые данные — сохраним черновик. Филиалы, фото и модерацию добавите в
              следующем шаге.
            </p>
          </div>
          <div className="grid gap-0 border-t border-line sm:grid-cols-3">
            {[
              { n: "1", t: "Черновик", d: "Название и контакты" },
              { n: "2", t: "Профиль", d: "Филиалы и контент" },
              { n: "3", t: "Модерация", d: "Публикация в каталоге" },
            ].map((item, index) => (
              <div
                key={item.n}
                className={`flex items-start gap-3 px-5 py-4 ${index === 0 ? "bg-mint" : ""} ${
                  index < 2 ? "sm:border-r sm:border-line" : ""
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                    index === 0 ? "bg-primary text-white" : "bg-sand text-muted"
                  }`}
                >
                  {item.n}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-ink">{item.t}</p>
                  <p className="text-xs text-muted">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {specialties.isLoading ? <p className="text-muted">Загрузка направлений…</p> : null}
      {specialties.isError ? <p className="text-danger">Не удалось загрузить направления</p> : null}
      {specialties.data ? (
        <ClinicEditorForm
          specialties={specialties.data}
          onSubmit={async (payload) => {
            const created = await createCabinetClinic(payload);
            void navigate({ to: "/cabinet/clinics/$id", params: { id: created.id } });
          }}
        />
      ) : null}
    </div>
  );
}
