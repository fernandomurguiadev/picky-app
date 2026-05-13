"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormData } from "@/lib/types/catalog";

function OptionItemRow({
  groupIndex,
  itemIndex,
  onRemove,
}: {
  groupIndex: number;
  itemIndex: number;
  onRemove: () => void;
}) {
  const { register, watch, setValue } = useFormContext<ProductFormData>();
  const path = `optionGroups.${groupIndex}.items.${itemIndex}` as const;
  const priceModifier = watch(`${path}.priceModifier`);

  return (
    <div className="flex items-center gap-2">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        {...register(`${path}.name`)}
        placeholder="Nombre del item"
        className="flex-1"
        aria-label="Nombre del item"
      />
      <div className="relative w-28 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          +$
        </span>
        <Input
          type="number"
          min={0}
          step={1}
          placeholder="0"
          className="pl-8"
          value={priceModifier === 0 ? "" : String(priceModifier / 100)}
          onChange={(e) => {
            const pesos = parseFloat(e.target.value) || 0;
            setValue(`${path}.priceModifier`, Math.round(pesos * 100), { shouldDirty: true });
          }}
          aria-label="Precio adicional en pesos"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive shrink-0"
        onClick={onRemove}
        aria-label="Eliminar item"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function OptionGroupCard({
  groupIndex,
  onRemoveGroup,
}: {
  groupIndex: number;
  onRemoveGroup: () => void;
}) {
  const { register, watch, setValue, control } = useFormContext<ProductFormData>();
  const basePath = `optionGroups.${groupIndex}` as const;
  const type = watch(`${basePath}.type`);
  const isRequired = watch(`${basePath}.isRequired`);

  const { fields: items, append, remove } = useFieldArray({
    control,
    name: `${basePath}.items`,
  });

  return (
    <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`og-name-${groupIndex}`}>Nombre del grupo *</Label>
          <Input
            id={`og-name-${groupIndex}`}
            {...register(`${basePath}.name`)}
            placeholder="Ej. Tamaño, Extras, Bebida"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive mt-6 shrink-0"
          onClick={onRemoveGroup}
          aria-label="Eliminar grupo"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              setValue(`${basePath}.type`, v as "radio" | "checkbox", { shouldDirty: true })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radio">Radio (uno)</SelectItem>
              <SelectItem value="checkbox">Checkbox (varios)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Switch
            id={`og-req-${groupIndex}`}
            checked={isRequired}
            onCheckedChange={(v) =>
              setValue(`${basePath}.isRequired`, v, { shouldDirty: true })
            }
          />
          <Label htmlFor={`og-req-${groupIndex}`}>Obligatorio</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Opciones</Label>
        {items.map((item, itemIndex) => (
          <OptionItemRow
            key={item.id}
            groupIndex={groupIndex}
            itemIndex={itemIndex}
            onRemove={() => remove(itemIndex)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() =>
            append({ name: "", priceModifier: 0, isDefault: false, order: items.length })
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar opción
        </Button>
      </div>
    </div>
  );
}

export function OptionGroupEditor() {
  const { control } = useFormContext<ProductFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "optionGroups",
  });

  return (
    <div className="space-y-3">
      {fields.map((group, groupIndex) => (
        <OptionGroupCard
          key={group.id}
          groupIndex={groupIndex}
          onRemoveGroup={() => remove(groupIndex)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            name: "",
            type: "radio",
            isRequired: false,
            minSelections: 0,
            maxSelections: 1,
            order: fields.length,
            items: [],
          })
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar grupo de opciones
      </Button>
    </div>
  );
}
