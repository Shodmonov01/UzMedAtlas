import { useState } from "react";
import type { CabinetService } from "@/shared/api/cabinet";
import { addBranchService, deleteBranchService, updateBranchService } from "@/shared/api/cabinet";
import { Field } from "./FormField";

type SpecialtyOption = { id: string; nameRu: string; nameEn: string };

type Props = {
  clinicId: string;
  branchId: string;
  services: CabinetService[];
  specialties: SpecialtyOption[];
  locked?: boolean;
  onChanged: () => Promise<void>;
};

function formatPrice(service: CabinetService) {
  if (service.priceUsd == null) return "без цены";
  const amount = service.priceUsd.toLocaleString("ru-RU");
  const currency = service.currency === "USD" ? "$" : "сум";
  const unit = service.unit ? ` / ${service.unit}` : "";
  return service.currency === "USD" ? `$${amount}${unit}` : `${amount} ${currency}${unit}`;
}

/** The labelled fields of a service, empty for a new one or filled from `service` when editing. */
function ServiceFields({ service, specialties }: { service?: CabinetService; specialties: SpecialtyOption[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Название (RU) *">
        <input name="nameRu" required className="field" defaultValue={service?.nameRu} placeholder="Например, МРТ головного мозга" />
      </Field>
      <Field label="Название (EN) *">
        <input name="nameEn" required className="field" defaultValue={service?.nameEn} placeholder="For example, brain MRI" />
      </Field>
      <Field label="Направление *" wide>
        <select name="specialtyId" required={!service} className="field" defaultValue={service ? service.specialtyId : specialties[0]?.id}>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameRu || s.nameEn}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Цена" hint="Можно оставить пустым">
        <input name="priceUsd" type="number" min={0} className="field" defaultValue={service?.priceUsd ?? ""} placeholder="500000" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Валюта">
          <select name="currency" className="field" defaultValue={service?.currency || "UZS"}>
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="За что">
          <input name="unit" className="field" defaultValue={service?.unit || ""} placeholder="приём, сеанс…" />
        </Field>
      </div>
      <Field label="Описание (RU)" wide>
        <textarea name="descriptionRu" rows={2} className="field" defaultValue={service?.descriptionRu} placeholder="Что входит в услугу" />
      </Field>
      <Field label="Описание (EN)" wide>
        <textarea name="descriptionEn" rows={2} className="field" defaultValue={service?.descriptionEn} placeholder="What the service includes" />
      </Field>
    </div>
  );
}

export function BranchServicesPanel({
  clinicId,
  branchId,
  services,
  specialties,
  locked,
  onChanged,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!specialties.length) {
    return (
      <div className="soft-card rounded-[1.5rem] bg-white p-6">
        <h2 className="text-xl font-extrabold">Услуги филиала</h2>
        <p className="mt-2 text-sm text-muted">Сначала выберите направления у филиала.</p>
      </div>
    );
  }

  return (
    <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
      <h2 className="text-xl font-extrabold">Услуги филиала</h2>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <ul className="space-y-3">
        {services.map((service) => (
          <li key={service.id} className="rounded-xl border border-line p-3">
            {editingId === service.id && !locked ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const fd = new FormData(e.currentTarget);
                  try {
                    await updateBranchService(clinicId, branchId, service.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      specialtyId: String(fd.get("specialtyId")),
                      descriptionRu: String(fd.get("descriptionRu") || ""),
                      descriptionEn: String(fd.get("descriptionEn") || ""),
                      priceUsd: fd.get("priceUsd") ? Number(fd.get("priceUsd")) : null,
                      currency: (String(fd.get("currency") || "UZS") as "UZS" | "USD"),
                      unit: String(fd.get("unit") || ""),
                    });
                    setEditingId(null);
                    await onChanged();
                  } catch {
                    setError("Не удалось обновить услугу");
                  }
                }}
              >
                <ServiceFields service={service} specialties={specialties} />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm">
                    Сохранить
                  </button>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => setEditingId(null)}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{service.nameRu || service.nameEn}</p>
                  <p className="text-sm text-muted">
                    {service.specialty?.nameRu || service.specialty?.nameEn || "—"} · {formatPrice(service)}
                  </p>
                </div>
                {!locked ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="text-sm font-bold text-primary"
                      onClick={() => setEditingId(service.id)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="text-sm font-bold text-danger"
                      onClick={async () => {
                        setError(null);
                        try {
                          await deleteBranchService(clinicId, branchId, service.id);
                          await onChanged();
                        } catch {
                          setError("Не удалось удалить услугу");
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </li>
        ))}
        {!services.length ? <li className="text-sm text-muted">Услуг пока нет</li> : null}
      </ul>

      {!locked ? (
        <form
          className="space-y-3 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            try {
              await addBranchService(clinicId, branchId, {
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                specialtyId: String(fd.get("specialtyId")),
                descriptionRu: String(fd.get("descriptionRu") || ""),
                descriptionEn: String(fd.get("descriptionEn") || ""),
                priceUsd: fd.get("priceUsd") ? Number(fd.get("priceUsd")) : null,
                currency: (String(fd.get("currency") || "UZS") as "UZS" | "USD"),
                unit: String(fd.get("unit") || ""),
              });
              form.reset();
              await onChanged();
            } catch {
              setError("Не удалось добавить услугу");
            }
          }}
        >
          <div>
            <h3 className="font-extrabold">Добавить услугу</h3>
            <p className="mt-1 text-sm text-muted">Поля со звёздочкой обязательны, цену можно не указывать.</p>
          </div>
          <ServiceFields specialties={specialties} />
          <button type="submit" className="btn btn-primary text-sm">
            Добавить услугу
          </button>
        </form>
      ) : null}
    </div>
  );
}
