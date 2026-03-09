# Skill: openspec-sync-specs

## Responsabilidad
Verificar que la spec en diseño no contradice specs en status 'applied' o 'archived'.

## Input
- spec: OpenSpec (en status 'designed')
- specHistory: OpenSpec[] (todas las specs con status 'applied' | 'archived')

## Output
- conflicts: SpecConflict[]
- hasBlockingConflict: boolean

## Interface
interface SpecConflict {
  conflictingSpecId: string
  conflictingSpecVersion: string
  description: string
  severity: 'blocking' | 'warning'
}
