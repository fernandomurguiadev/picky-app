import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  Matches,
  registerDecorator,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

const DAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ShiftDto {
  @IsString()
  @Matches(TIME_REGEX, { message: 'open must be in HH:mm format' })
  open!: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'close must be in HH:mm format' })
  close!: string;
}

function ValidShifts(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validShifts',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: {
        message:
          'shifts must be empty when isOpen is false, each shift must have open < close, and shifts must not overlap',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as DayScheduleDto;
          const shifts = value as ShiftDto[] | undefined;

          if (!obj.isOpen) return !shifts || shifts.length === 0;
          if (!Array.isArray(shifts)) return true; // other validators handle array check

          for (const shift of shifts) {
            if (!shift.open || !shift.close) return false;
            if (shift.open >= shift.close) return false;
          }

          for (let i = 0; i < shifts.length - 1; i++) {
            if (shifts[i]!.close > shifts[i + 1]!.open) return false;
          }

          return true;
        },
      },
    });
  };
}

export class DayScheduleDto {
  @IsString()
  @IsIn(DAY_NAMES)
  day!: DayName;

  @IsBoolean()
  isOpen!: boolean;

  @IsArray()
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  @ValidShifts()
  shifts!: ShiftDto[];
}
