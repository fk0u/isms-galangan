import type { RefObject } from "react";
import { Camera, Upload } from "lucide-react";
import { AsyncButton, Field, FormGrid, Modal, MoneyInput, NumInput, toast } from "../../../components/ui";
import type { StoreItem } from "../../../data/store";
import { useT } from "../../../i18n/LanguageContext";
import { n_inv } from "../../../i18n/n_inv";
import { isBackendConfigured } from "../../../services/http";
import {
  buildUnitConversion,
  conversionRuleForCategory,
  formatUnitConversion,
  purchaseUnitsForCategory,
  type UnitConversionDraft,
} from "../../../utils/unitConversion";

export interface MaterialFormValues extends UnitConversionDraft {
  name: string;
  category: string;
  sku: string;
  warehouse: string;
  rack: string;
  bin: string;
  stock: string;
  minStock: string;
  unit: string;
  cost: string;
  volume: string;
  batch: string;
  photoUrl: string;
  matType: string;
  eceran: boolean;
}

interface Props {
  open: boolean;
  editing: StoreItem | null;
  form: MaterialFormValues;
  step: number;
  warehouses: string[];
  photoInputRef: RefObject<HTMLInputElement | null>;
  uploadingPhoto: boolean;
  onFieldChange: (key: keyof MaterialFormValues, value: string | boolean) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  onPhotoFile: (file: File | undefined) => void;
}

const CATEGORY_OPTIONS = [
  { value: "Baja", labelKey: "catBaja" },
  { value: "Mesin", labelKey: "catMesin" },
  { value: "Plat", labelKey: "catPlat" },
  { value: "Pipa", labelKey: "catPipa" },
  { value: "Besi", labelKey: "catBesi" },
  { value: "Listrik", labelKey: "catListrik" },
  { value: "Cat", labelKey: "catCat" },
  { value: "Cairan", labelKey: "catCairan" },
  { value: "Tonase", labelKey: "catTonase" },
  { value: "Fastener", labelKey: "catFastener" },
  { value: "Rigging", labelKey: "catRigging" },
  { value: "Perlindungan", labelKey: "catProtection" },
  { value: "Lainnya", labelKey: "catOther" },
] as const;

const MAT_TYPES = ["habis-pakai", "retur", "service"] as const;

function materialTypeLabel(value: string, strings: typeof n_inv.id): string {
  if (value === "retur") return strings.materialTypeReturnable;
  if (value === "service") return strings.materialTypeService;
  return strings.materialTypeConsumable;
}

function numericField(value: string, onChange: (value: string) => void, label: string, step = "any") {
  return (
    <Field label={label}>
      <NumInput min={0} step={step} className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export default function CatalogMaterialForm({
  open,
  editing,
  form,
  step,
  warehouses,
  photoInputRef,
  uploadingPhoto,
  onFieldChange,
  onClose,
  onSave,
  onNext,
  onBack,
  onPhotoFile,
}: Props) {
  const { locale } = useT();
  const S = n_inv[locale];
  const rule = conversionRuleForCategory(form.category);
  const preview = buildUnitConversion(form.category, form.unit, form);
  const stepTitle = S.formSteps[step] ?? S.formSteps[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? S.editTitle.replace("{n}", editing.id) : S.btnNew}
      subtitle={`${S.formStepIndicator.replace("{n}", String(step + 1))} · ${stepTitle}`}
      wide
      footer={(
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>{S.cancelBtn}</button>
            {step > 0 && <button type="button" className="btn-secondary" onClick={onBack}>{S.stepBack}</button>}
          </div>
          {step < 3
            ? <button type="button" className="btn-primary" onClick={onNext}>{S.stepNext}</button>
            : <AsyncButton className="btn-primary" onAction={onSave}>{S.saveBtn}</AsyncButton>}
        </div>
      )}
    >
      <div className="space-y-4">
        <ol aria-label={S.formStepsAria} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {S.formSteps.map((label, index) => (
            <li
              key={label}
              aria-current={step === index ? "step" : undefined}
              className={`rounded-xl border px-3 py-2 text-xs font-medium ${step === index ? "border-navy-700 bg-blue-50 text-navy-900" : step > index ? "border-teal-200 bg-teal-50 text-teal-800" : "border-steel-200 bg-white text-steel-500"}`}
            >
              <span className="mr-1.5 font-mono">{index + 1}.</span>{label}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-3">
            <FormGrid>
              <Field label={S.nameLbl}>
                <input className="input" value={form.name} onChange={(event) => onFieldChange("name", event.target.value)} placeholder={S.phName} autoFocus />
              </Field>
              <Field label={S.skuLbl}>
                <input className="input font-mono" value={form.sku} onChange={(event) => onFieldChange("sku", event.target.value)} placeholder={S.phSku} />
              </Field>
              <Field label={S.catLbl}>
                <select className="input" value={form.category} onChange={(event) => onFieldChange("category", event.target.value)}>
                  {CATEGORY_OPTIONS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>{S[labelKey]}</option>
                  ))}
                </select>
              </Field>
              <Field label={S.materialTypeLbl}>
                <select className="input" value={form.matType} onChange={(event) => onFieldChange("matType", event.target.value)}>
                  {MAT_TYPES.map((value) => <option key={value} value={value}>{materialTypeLabel(value, S)}</option>)}
                </select>
              </Field>
              <Field label={S.costLbl}>
                <MoneyInput className="input" value={form.cost} onChange={(value) => onFieldChange("cost", value)} />
              </Field>
              <Field label={S.volLbl} hint={S.hintVol}>
                <NumInput min={0} className="input" value={form.volume} onChange={(event) => onFieldChange("volume", event.target.value)} />
              </Field>
              <Field label={S.batchLbl} hint={form.category === "Mesin" ? S.hintBatchMesin : S.hintBatchOpt}>
                <input className="input font-mono" value={form.batch} onChange={(event) => onFieldChange("batch", event.target.value)} placeholder={S.phBatch} />
              </Field>
              <Field label={S.photoLbl} hint={S.hintPhoto}>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 shrink-0 text-steel-400" />
                  <input className="input font-mono" value={form.photoUrl} onChange={(event) => onFieldChange("photoUrl", event.target.value)} placeholder={S.photoUrlPlaceholder} />
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.xlsx,.csv"
                    className="hidden"
                    aria-label={S.photoAria}
                    onChange={(event) => onPhotoFile(event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="btn-secondary shrink-0 text-xs"
                    disabled={uploadingPhoto}
                    title={isBackendConfigured() ? S.uploadTitle : S.localPhotoUrl}
                    onClick={() => {
                      if (!isBackendConfigured()) { toast(S.localPhotoUrl, "info"); return; }
                      photoInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" /> {uploadingPhoto ? S.uploading : S.uploadBtn}
                  </button>
                </div>
              </Field>
            </FormGrid>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <FormGrid>
              <Field label={S.purchaseUnitLbl}>
                <select className="input" value={form.unit} onChange={(event) => onFieldChange("unit", event.target.value)}>
                  {purchaseUnitsForCategory(form.category, form.unit).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </Field>
              <Field label={S.eceranLbl} hint={S.eceranHint}>
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-steel-200 px-3 text-sm font-medium text-navy-900">
                  <input type="checkbox" checked={form.eceran} onChange={(event) => onFieldChange("eceran", event.target.checked)} className="h-4 w-4 accent-navy-700" />
                  {form.eceran ? S.yesLabel : S.noLabel}
                </label>
              </Field>
            </FormGrid>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="rounded-xl bg-steel-50 px-3 py-2 text-sm text-steel-600">{S.conversionStepHint}</p>
            {rule?.kind === "volume" && (
              <FormGrid>
                {numericField(form.conversionAmount ?? "", (value) => onFieldChange("conversionAmount", value), S.litersPerPackageLbl)}
              </FormGrid>
            )}
            {rule?.kind === "plate" && (
              <FormGrid>
                {numericField(form.conversionLengthMm ?? "", (value) => onFieldChange("conversionLengthMm", value), S.lengthMmLbl)}
                {numericField(form.conversionWidthMm ?? "", (value) => onFieldChange("conversionWidthMm", value), S.widthMmLbl)}
                {numericField(form.conversionThicknessMm ?? "", (value) => onFieldChange("conversionThicknessMm", value), S.thicknessMmLbl)}
                {numericField(form.conversionWeightKg ?? "", (value) => onFieldChange("conversionWeightKg", value), S.weightKgPerUnitLbl)}
              </FormGrid>
            )}
            {rule?.kind === "bar" && (
              <FormGrid>
                {numericField(form.conversionLengthMm ?? "", (value) => onFieldChange("conversionLengthMm", value), S.lengthPerBarMmLbl)}
                {numericField(form.conversionWeightKg ?? "", (value) => onFieldChange("conversionWeightKg", value), S.weightPerBarKgLbl)}
              </FormGrid>
            )}
            {rule?.kind === "tonnage" && (
              <FormGrid>
                {numericField(form.conversionAmount ?? "", (value) => onFieldChange("conversionAmount", value), S.kgPerUnitLbl)}
              </FormGrid>
            )}
            {!rule && form.eceran && (
              <FormGrid>
                <Field label={S.conversionBaseUnitLbl}>
                  <input className="input" value={form.conversionBaseUnit ?? ""} onChange={(event) => onFieldChange("conversionBaseUnit", event.target.value)} placeholder={S.conversionBaseUnitPh} />
                </Field>
                {numericField(form.conversionAmount ?? "", (value) => onFieldChange("conversionAmount", value), S.conversionQtyPerUnitLbl)}
              </FormGrid>
            )}
            {!rule && !form.eceran && <p className="rounded-xl border border-dashed border-steel-300 px-3 py-3 text-sm text-steel-500">{S.conversionOptional}</p>}
            {preview && (
              <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800" aria-live="polite">
                {S.conversionPreviewLbl}: {formatUnitConversion(form.unit, preview, locale)}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <FormGrid>
              <Field label={S.whLbl}>
                <select className="input" value={form.warehouse} onChange={(event) => onFieldChange("warehouse", event.target.value)}>
                  {(warehouses.length > 0 ? warehouses : [form.warehouse]).map((warehouse) => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
                </select>
              </Field>
              {editing ? (
                <Field label={S.stockNowLbl} hint={S.hintStockNow}>
                  <input className="input bg-steel-50" value={Number(editing.stock || 0).toLocaleString(locale === "en" ? "en-US" : "id-ID")} disabled readOnly />
                </Field>
              ) : (
                <Field label={S.stock0Lbl}>
                  <NumInput min={0} className="input" value={form.stock} onChange={(event) => onFieldChange("stock", event.target.value)} />
                </Field>
              )}
              <Field label={S.minLbl}>
                <NumInput min={0} className="input" value={form.minStock} onChange={(event) => onFieldChange("minStock", event.target.value)} />
              </Field>
              <Field label={S.rackLbl} hint={S.hintRack}>
                <input className="input font-mono" value={form.rack} onChange={(event) => onFieldChange("rack", event.target.value)} placeholder={S.phRack} />
              </Field>
              <Field label={S.binLbl} hint={S.hintBin}>
                <input className="input font-mono" value={form.bin} onChange={(event) => onFieldChange("bin", event.target.value)} placeholder={S.phBin} />
              </Field>
            </FormGrid>
          </div>
        )}
      </div>
    </Modal>
  );
}
