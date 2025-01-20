import { PRules } from "./rules"
import { PRulesParams } from "./rulesEngine"

export const rules = (params?: PRulesParams) => new PRules(params)