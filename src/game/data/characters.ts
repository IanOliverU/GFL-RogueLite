import type { WeaponId } from './weapons'

export interface CharacterDefinition {
  readonly id: string
  readonly name: string
  readonly weaponId: WeaponId
  readonly maxHealth: number
  readonly color: string
}

export const CHARACTERS = {
  sabrina: { id: 'sabrina', name: 'Sabrina', weaponId: 'broad-shotgun', maxHealth: 100, color: '#b0d7ca' },
  qiongjiu: { id: 'qiongjiu', name: 'Qiongjiu', weaponId: 'burst-rifle', maxHealth: 100, color: '#ddb7a4' },
  tololo: { id: 'tololo', name: 'Tololo', weaponId: 'rapid-rifle', maxHealth: 100, color: '#a5c6e8' },
  'mosin-nagant': { id: 'mosin-nagant', name: 'Mosin-Nagant', weaponId: 'piercing-sniper', maxHealth: 100, color: '#c5b2dc' },
  peritya: { id: 'peritya', name: 'Peritya', weaponId: 'machine-gun', maxHealth: 100, color: '#d8bada' },
  vepley: { id: 'vepley', name: 'Vepley', weaponId: 'light-shotgun', maxHealth: 100, color: '#e6d093' },
} as const satisfies Record<string, CharacterDefinition>

export type CharacterId = keyof typeof CHARACTERS
export const CHARACTER_LIST = Object.values(CHARACTERS)
