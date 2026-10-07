"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BusinessSettingsInput } from "@/lib/validation";
import type { BusinessType } from "@/types/database";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/labels";
import { mediaUrl, uploadMedia } from "@/lib/storage";
import { saveSettings } from "./actions";

export function SettingsForm({
  businessId,
  initial,
  slug,
}: {
  businessId: string;
  initial: BusinessSettingsInput;
  slug: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof BusinessSettingsInput>(
    key: K,
    value: BusinessSettingsInput[K]
  ) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Inputs de texto opcionais: string vazia vira null no submit. */
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let logoPath = form.logo_path;
      let coverPath = form.cover_path;
      try {
        if (logoFile) logoPath = await uploadMedia(businessId, "logo", logoFile);
        if (coverFile)
          coverPath = await uploadMedia(businessId, "cover", coverFile);
      } catch {
        setError("Não foi possível enviar a imagem. Tente novamente.");
        return;
      }
      const result = await saveSettings({
        ...form,
        logo_path: logoPath,
        cover_path: coverPath,
        custom_professional_label: orNull(form.custom_professional_label ?? ""),
        address: orNull(form.address ?? ""),
        phone: orNull(form.phone ?? ""),
        whatsapp: orNull(form.whatsapp ?? ""),
        pix_key: orNull(form.pix_key ?? ""),
      });
      if (result.error) setError(result.error);
      else {
        setForm((f) => ({ ...f, logo_path: logoPath, cover_path: coverPath }));
        setLogoFile(null);
        setCoverFile(null);
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Negócio</h2>

        <div>
          <span className="mb-1 block text-sm font-medium">
            Foto de perfil / logo
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {logoFile || form.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  logoFile
                    ? URL.createObjectURL(logoFile)
                    : mediaUrl(form.logo_path)!
                }
                alt="Logo"
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-300">
                {form.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="block w-full max-w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
              {(form.logo_path || logoFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    set("logo_path", null);
                  }}
                  className="text-xs text-zinc-500 underline"
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">
            Capa da página (estilo Facebook)
          </span>
          {coverFile || form.cover_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                coverFile
                  ? URL.createObjectURL(coverFile)
                  : mediaUrl(form.cover_path)!
              }
              alt="Capa"
              className="h-28 w-full rounded-xl object-cover"
              style={{ objectPosition: `50% ${form.cover_position}%` }}
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
              Sem capa — a página usa a cor da marca
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="block w-full max-w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white sm:w-auto"
            />
            {(form.cover_path || coverFile) && (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  set("cover_path", null);
                }}
                className="whitespace-nowrap text-xs text-zinc-500 underline"
              >
                Remover capa
              </button>
            )}
          </div>
          <span className="mt-1 block text-xs text-zinc-400">
            Use uma foto do seu espaço ou do seu trabalho (ideal: 1600×500px).
          </span>
          {(coverFile || form.cover_path) && (
            <label className="mt-2 block">
              <span className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Ajustar enquadramento (↑ topo · ↓ base)</span>
                <span>{form.cover_position}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={form.cover_position}
                onChange={(e) =>
                  set("cover_position", Number(e.target.value))
                }
                className="w-full accent-zinc-900"
              />
            </label>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nome</span>
          <input
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">Tipo</span>
            <select
              value={form.business_type}
              onChange={(e) =>
                set("business_type", e.target.value as BusinessType)
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">Cor da marca</span>
            <input
              type="color"
              value={form.brand_primary}
              onChange={(e) => set("brand_primary", e.target.value)}
              className="h-[42px] w-full rounded-lg border border-zinc-300"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Como chamar a equipe (opcional)
          </span>
          <input
            maxLength={30}
            value={form.custom_professional_label ?? ""}
            onChange={(e) => set("custom_professional_label", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder='Ex.: "Barbeiro", "Manicure"'
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Endereço (opcional)
          </span>
          <input
            maxLength={200}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder="Rua, número, bairro"
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">
              Telefone (opcional)
            </span>
            <input
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="(11) 3333-4444"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">
              WhatsApp (opcional)
            </span>
            <input
              type="tel"
              value={form.whatsapp ?? ""}
              onChange={(e) => set("whatsapp", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="(11) 99999-9999"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Pagamento do sinal</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Chave Pix (opcional)
          </span>
          <input
            maxLength={140}
            value={form.pix_key ?? ""}
            onChange={(e) => set("pix_key", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
          <span className="mt-1 block text-xs text-zinc-400">
            Exibida ao cliente na confirmação da reserva para pagar o sinal de
            50%. Sem chave, o sinal é combinado presencialmente.
          </span>
        </label>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block font-medium">Página publicada</span>
            <span className="block text-sm text-zinc-500">
              Quando ativa, sua página fica no ar em <code>/{slug}</code> e
              aceita reservas. Cadastre serviços, equipe e horários antes.
            </span>
          </span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar configurações"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Salvo ✓</span>}
      </div>
    </form>
  );
}
