"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, ScanLine, PencilLine, Package, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useFoods, useToggleFavorite } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { Food, PendingFood } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "../product-thumb";
import { MyMealsBar, AddMealSheet } from "../sheets/my-meal-sheets";
import type { SavedMeal } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Segmented } from "../segmented";

export function LogScreen({ onPickFood }: { onPickFood: (f: PendingFood) => void }) {
  const { t, nf } = useI18n();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filter, setFilter] = useState<"all" | "fav">("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  const { data: foods, isLoading } = useFoods(debouncedQ, filter === "fav");
  const toggleFav = useToggleFavorite();
  const openSheet = useAppStore((s) => s.openSheet);
  /** saved meal picked from the وجباتي bar */
  const [addingMeal, setAddingMeal] = useState<SavedMeal | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openSheet("scan")}
          className="nutra-card p-4 flex flex-col items-start gap-2 text-start active:scale-[0.97] transition-transform"
        >
          <span className="size-10 rounded-2xl bg-primary/12 text-primary grid place-items-center">
            <ScanLine className="size-5" />
          </span>
          <span className="text-sm font-bold">{t("scan_product")}</span>
          <span className="text-xs text-muted-foreground leading-relaxed">{t("scan_hint")}</span>
        </button>
        <button
          onClick={() => openSheet("manual-food")}
          className="nutra-card p-4 flex flex-col items-start gap-2 text-start active:scale-[0.97] transition-transform"
        >
          <span className="size-10 rounded-2xl bg-carbs/12 text-carbs-text grid place-items-center">
            <PencilLine className="size-5" />
          </span>
          <span className="text-sm font-bold">{t("manual_entry")}</span>
          <span className="text-xs text-muted-foreground leading-relaxed">{t("manual_hint")}</span>
        </button>
      </div>

      {/* وجباتي bar — re-add a saved meal to any day & meal type */}
      <MyMealsBar onPick={setAddingMeal} />

      {/* search */}
      <div className="relative flex items-center">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search_foods")}
          aria-label={t("search_foods")}
          className="w-full h-13 rounded-[22px] bg-card border border-border ps-11 pe-12 text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setDebouncedQ("");
            }}
            aria-label={t("clear_search")}
            className="absolute end-1 size-11 grid place-items-center text-muted-foreground hover:text-foreground transition-colors rounded-xl"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>

      <Segmented
        ariaLabel={t("my_foods")}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("all") },
          { value: "fav", label: `★ ${t("favorites")}` },
        ]}
      />

      {/* list */}
      {isLoading && !foods ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-[22px]" />
          ))}
        </div>
      ) : !foods?.length ? (
        <div className="nutra-card p-8 flex flex-col items-center gap-3 text-center">
          <span className="size-12 rounded-2xl bg-secondary grid place-items-center">
            <Package className="size-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-semibold">{debouncedQ || q ? t("no_results") : t("no_foods")}</p>
          {debouncedQ || q ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setDebouncedQ("");
                }}
                className="h-11 px-4 rounded-full bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 active:scale-95 transition-all"
              >
                {t("clear_search")}
              </button>
              <button
                type="button"
                onClick={() => openSheet("manual-food")}
                className="h-11 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
              >
                {t("add_custom_food")}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("no_foods_hint")}</p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {foods.map((f) => (
            <FoodRow
              key={f.id}
              food={f}
              onPick={() =>
                onPickFood({
                  id: f.id,
                  name: f.name,
                  brand: f.brand,
                  servingSizeG: f.servingSizeG,
                  kcal100: f.kcal100,
                  protein100: f.protein100,
                  carbs100: f.carbs100,
                  fat100: f.fat100,
                  sugar100: f.sugar100,
                  satFat100: f.satFat100,
                  fiber100: f.fiber100,
                  salt100: f.salt100,
                  imageUrl: f.imageUrl,
                  source: "myfoods",
                })
              }
              onToggleFav={() =>
                toggleFav.mutate(
                  { id: f.id, isFavorite: !f.isFavorite },
                  {
                    onError: () => toast.error(t("error_toast")),
                  }
                )
              }
            />
          ))}
        </ul>
      )}

      {/* add saved meal to a day/meal type */}
      <AddMealSheet meal={addingMeal} onClose={() => setAddingMeal(null)} />
    </div>
  );
}

function FoodRow({
  food,
  onPick,
  onToggleFav,
}: {
  food: Food;
  onPick: () => void;
  onToggleFav: () => void;
}) {
  const { t, nf } = useI18n();
  return (
    <li className="nutra-card px-4 py-3 flex items-center gap-3">
      <button onClick={onPick} className="flex items-center gap-3 flex-1 min-w-0 text-start min-h-[44px]">
        <ProductThumb src={food.imageUrl} name={food.name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{food.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {food.brand ? `${food.brand} · ` : ""}
            <span className="tabular">
              {nf(food.kcal100)} {t("kcal")}/{t("per_100g")}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-bold tabular">{nf(food.kcal100)}</span>
          <span className="text-xs text-muted-foreground font-medium leading-normal">
            {t("kcal")}/{t("per_100g")}
          </span>
        </div>
      </button>
      <button
        aria-label={`${t("favorites")}: ${food.name}`}
        onClick={onToggleFav}
        className={cn(
          "size-11 grid place-items-center rounded-full transition-colors",
          food.isFavorite ? "text-carbs-text" : "text-muted-foreground/40 hover:text-carbs-text"
        )}
      >
        <Star className="size-5" fill={food.isFavorite ? "currentColor" : "none"} />
      </button>
    </li>
  );
}
