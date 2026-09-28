import { useState } from "react";
import type { CabinetEquipment } from "@/shared/api/cabinet";
import {
  addBranchEquipment,
  deleteBranchEquipment,
  updateBranchEquipment,
  uploadCabinetFile,
} from "@/shared/api/cabinet";

type Props = {
  clinicId: string;
  branchId: string;
  equipment: CabinetEquipment[];
  locked?: boolean;
  onChanged: () => Promise<void>;
};

export function BranchEquipmentPanel({ clinicId, branchId, equipment, locked, onChanged }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
      <h2 className="text-xl font-extrabold">Оборудование филиала</h2>
      <p className="text-sm text-muted">Аппаратура и техника, доступные в этом филиале.</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <ul className="space-y-3">
        {equipment.map((item) => (
          <li key={item.id} className="rounded-xl border border-line p-3">
            {editingId === item.id && !locked ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const fd = new FormData(e.currentTarget);
                  try {
                    await updateBranchEquipment(clinicId, branchId, item.id, {
                      nameRu: String(fd.get("nameRu")),
                      nameEn: String(fd.get("nameEn")),
                      manufacturer: String(fd.get("manufacturer") || ""),
                      descriptionRu: String(fd.get("descriptionRu") || ""),
                      descriptionEn: String(fd.get("descriptionEn") || ""),
                      photoUrl: String(fd.get("photoUrl") || "") || null,
                    });
                    setEditingId(null);
                    await onChanged();
                  } catch {
                    setError("Не удалось обновить оборудование");
                  }
                }}
              >
                <div className="grid gap-2 md:grid-cols-2">
                  <input name="nameRu" required className="field" defaultValue={item.nameRu} />
                  <input name="nameEn" required className="field" defaultValue={item.nameEn} />
                  <input
                    name="manufacturer"
                    className="field md:col-span-2"
                    defaultValue={item.manufacturer || ""}
                    placeholder="Производитель"
                  />
                  <textarea
                    name="descriptionRu"
                    rows={2}
                    className="field md:col-span-2"
                    defaultValue={item.descriptionRu || ""}
                  />
                  <textarea
                    name="descriptionEn"
                    rows={2}
                    className="field md:col-span-2"
                    defaultValue={item.descriptionEn || ""}
                  />
                  <input
                    name="photoUrl"
                    className="field md:col-span-2"
                    defaultValue={item.photoUrl || ""}
                    placeholder="URL фото"
                  />
                </div>
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
                <div className="flex min-w-0 gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-sand text-xs font-bold text-muted">
                      —
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold">{item.nameRu || item.nameEn}</p>
                    {(item.descriptionRu || item.descriptionEn) && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {item.descriptionRu || item.descriptionEn}
                      </p>
                    )}
                  </div>
                </div>
                {!locked ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="text-sm font-bold text-primary"
                      onClick={() => setEditingId(item.id)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="text-sm font-bold text-danger"
                      onClick={async () => {
                        setError(null);
                        try {
                          await deleteBranchEquipment(clinicId, branchId, item.id);
                          await onChanged();
                        } catch {
                          setError("Не удалось удалить");
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
        {!equipment.length ? <li className="text-sm text-muted">Оборудование пока не добавлено</li> : null}
      </ul>

      {!locked ? (
        <form
          className="space-y-3 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const form = e.currentTarget;
            const fd = new FormData(form);
            const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
            try {
              setUploading(true);
              let photoUrl: string | null = String(fd.get("photoUrl") || "") || null;
              if (file) {
                photoUrl = await uploadCabinetFile(file);
              }
              await addBranchEquipment(clinicId, branchId, {
                nameRu: String(fd.get("nameRu")),
                nameEn: String(fd.get("nameEn")),
                manufacturer: String(fd.get("manufacturer") || ""),
                descriptionRu: String(fd.get("descriptionRu") || ""),
                descriptionEn: String(fd.get("descriptionEn") || ""),
                photoUrl,
              });
              form.reset();
              await onChanged();
            } catch {
              setError("Не удалось добавить оборудование");
            } finally {
              setUploading(false);
            }
          }}
        >
          <h3 className="font-extrabold">+ Добавить оборудование</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input name="nameRu" required className="field" placeholder="Название RU" />
            <input name="nameEn" required className="field" placeholder="Name EN" />
            <input name="manufacturer" className="field md:col-span-2" placeholder="Производитель" />
            <textarea
              name="descriptionRu"
              rows={2}
              className="field md:col-span-2"
              placeholder="Описание RU"
            />
            <textarea
              name="descriptionEn"
              rows={2}
              className="field md:col-span-2"
              placeholder="Description EN"
            />
            <input name="file" type="file" accept="image/*" className="field md:col-span-2" />
          </div>
          <button type="submit" className="btn btn-primary text-sm" disabled={uploading}>
            {uploading ? "Загрузка…" : "Добавить"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
