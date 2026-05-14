"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import type { OptionGroup, OptionItem } from "@/lib/types/catalog";
import type { SelectedOption } from "@/lib/types/store";

interface VariantSelectorProps {
  optionGroups: OptionGroup[];
  value: SelectedOption[];
  onChange: (options: SelectedOption[]) => void;
  onValidityChange?: (isValid: boolean) => void;
}

function toSelectedOption(group: OptionGroup, item: OptionItem): SelectedOption {
  return {
    groupId: group.id,
    groupName: group.name,
    itemId: item.id,
    itemName: item.name,
    priceModifier: item.priceModifier,
  };
}

export function VariantSelector({
  optionGroups,
  value,
  onChange,
  onValidityChange,
}: VariantSelectorProps) {
  const [touchedGroups, setTouchedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const isValid = optionGroups.every((group) => {
      if (!group.isRequired) return true;
      return value.some((selected) => selected.groupId === group.id);
    });
    onValidityChange?.(isValid);
  }, [onValidityChange, optionGroups, value]);

  if (!optionGroups.length) return null;

  return (
    <div className="space-y-5">
      {optionGroups.map((group) => {
        const selectedInGroup = value.filter((selected) => selected.groupId === group.id);
        const showError = group.isRequired && touchedGroups[group.id] && selectedInGroup.length === 0;

        return (
          <fieldset key={group.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <legend className="text-sm font-semibold">{group.name}</legend>
              {group.isRequired && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-700">
                  Obligatorio
                </span>
              )}
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const checked = selectedInGroup.some((selected) => selected.itemId === item.id);

                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors",
                      checked
                        ? "border-[var(--color-primary)] bg-orange-50"
                        : "border-border hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type={group.type === "radio" ? "radio" : "checkbox"}
                        name={`group-${group.id}`}
                        checked={checked}
                        onChange={() => {
                          setTouchedGroups((current) => ({ ...current, [group.id]: true }));
                          if (group.type === "radio") {
                            onChange([
                              ...value.filter((selected) => selected.groupId !== group.id),
                              toSelectedOption(group, item),
                            ]);
                            return;
                          }

                          if (checked) {
                            onChange(
                              value.filter((selected) => selected.itemId !== item.id)
                            );
                            return;
                          }

                          onChange([...value, toSelectedOption(group, item)]);
                        }}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.isDefault && (
                          <p className="text-xs text-muted-foreground">Opción sugerida</p>
                        )}
                      </div>
                    </div>
                    {item.priceModifier > 0 && (
                      <span className="text-sm font-medium text-[var(--color-primary)]">
                        +{formatCurrency(item.priceModifier)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {showError && (
              <p className="text-xs text-destructive">
                Seleccioná al menos una opción en {group.name.toLowerCase()}.
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
