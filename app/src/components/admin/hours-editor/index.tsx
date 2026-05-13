"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DaySchedule, DayKey } from "@/lib/types/store-settings";

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const ALL_DAYS: DayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const shiftSchema = z.object({
  open: z.string().regex(timeRegex, "Formato HH:mm"),
  close: z.string().regex(timeRegex, "Formato HH:mm"),
});

const daySchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  isOpen: z.boolean(),
  shifts: z.array(shiftSchema).max(2, "Máximo 2 turnos"),
});

const schema = z.object({
  schedule: z.array(daySchema),
});

type FormValues = z.infer<typeof schema>;

interface HoursEditorProps {
  value: DaySchedule[] | null;
  onSubmit: (schedule: DaySchedule[]) => Promise<void>;
  isPending?: boolean;
}

export function HoursEditor({ value, onSubmit, isPending }: HoursEditorProps) {
  const defaultSchedule: DaySchedule[] = ALL_DAYS.map((day) => ({
    day,
    isOpen: day !== "sunday",
    shifts: [{ open: "09:00", close: "18:00" }],
  }));

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { schedule: value ?? defaultSchedule },
    });

  useEffect(() => {
    if (value) {
      // Asegurar que todos los días estén presentes
      const filled = ALL_DAYS.map((day) => {
        const found = value.find((d) => d.day === day);
        return found ?? { day, isOpen: false, shifts: [{ open: "09:00", close: "18:00" }] };
      });
      reset({ schedule: filled });
    }
  }, [value, reset]);

  const { fields } = useFieldArray({ control, name: "schedule" });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit(data.schedule as DaySchedule[]);
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
      {fields.map((field, dayIndex) => {
        const isOpen = watch(`schedule.${dayIndex}.isOpen`);
        const shifts = watch(`schedule.${dayIndex}.shifts`);
        const dayErrors = errors.schedule?.[dayIndex];

        return (
          <div
            key={field.id}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              isOpen ? "border-border bg-card" : "border-border/50 bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isOpen}
                  onCheckedChange={(v) =>
                    setValue(`schedule.${dayIndex}.isOpen`, v, { shouldDirty: true })
                  }
                  id={`day-${field.day}`}
                />
                <Label
                  htmlFor={`day-${field.day}`}
                  className={cn("font-medium", !isOpen && "text-muted-foreground")}
                >
                  {DAY_LABELS[field.day as DayKey]}
                </Label>
              </div>
              {isOpen && shifts.length < 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const current = watch(`schedule.${dayIndex}.shifts`);
                    setValue(`schedule.${dayIndex}.shifts`, [
                      ...current,
                      { open: "14:00", close: "20:00" },
                    ], { shouldDirty: true });
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  2° turno
                </Button>
              )}
            </div>

            {isOpen && (
              <div className="space-y-2">
                {shifts.map((_, shiftIndex) => (
                  <div key={shiftIndex} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground w-14 shrink-0">
                      {shiftIndex === 0 ? "Turno 1" : "Turno 2"}
                    </span>
                    <Controller
                      control={control}
                      name={`schedule.${dayIndex}.shifts.${shiftIndex}.open`}
                      render={({ field }) => (
                        <Input type="time" className="w-32" {...field} aria-label="Apertura" />
                      )}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Controller
                      control={control}
                      name={`schedule.${dayIndex}.shifts.${shiftIndex}.close`}
                      render={({ field }) => (
                        <Input type="time" className="w-32" {...field} aria-label="Cierre" />
                      )}
                    />
                    {shiftIndex === 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          const current = watch(`schedule.${dayIndex}.shifts`);
                          setValue(`schedule.${dayIndex}.shifts`, [current[0]], { shouldDirty: true });
                        }}
                        aria-label="Eliminar 2° turno"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {dayErrors && (
                  <p className="text-xs text-destructive">
                    {String(dayErrors.shifts?.message ?? "")}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar horarios"}
        </Button>
      </div>
    </form>
  );
}
