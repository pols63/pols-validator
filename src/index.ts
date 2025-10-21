import { PRules, PSanitizeParams } from "./rules"
import { PRulesParams } from "./rulesEngine"

export type PRulesCreator<T> = {
	(label: string, required?: boolean, _default?: unknown): T
	(required: boolean, _default?: unknown): T
	(params?: PRulesParams): T
}

export const rules: PRulesCreator<PRules> = (...args: any[]) => new PRules(...args)

export { PRules, PRulesParams, PSanitizeParams }

export { PRulesResponse, PRulesWrapper, PRulesFunction } from './rulesEngine'