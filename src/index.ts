import { Rules } from "./rules"
import { RulesEngine, Wrapper } from "./rulesEngine"

export type EvaluateResponse<T> = {
	error: false
	success: true
	result: T
} | {
	error: true
	success: false
	messages: string[]
}

export const validate = <T>(target: unknown, rules: RulesEngine): EvaluateResponse<T> => {
	const errorMessages: string[] = []

	const isEmpty = target == null || (typeof target == 'string' && !target)
	const label = rules.label ?? 'Este valor'

	if (rules.required && isEmpty) {
		return {
			error: true,
			success: false,
			messages: [`'${label}' es requerido`]
		}
	}

	if (isEmpty) {
		return {
			error: false,
			success: true,
			result: rules.default as T
		}
	}

	const wrapper: Wrapper<T> = {
		value: target as T,
		label
	}
	for (const validationFunction of Object.values(rules.collection)) {
		const result = validationFunction(wrapper)
		if (!result) continue
		if (typeof result == 'string') {
			errorMessages.push(result)
		} else {
			if (wrapper.value == null || typeof wrapper.value != 'object') throw new Error(`El valor no es un objeto para ser validado contra un esquema: ${wrapper.value}`)

			for (const key in result.schema) {
				const rulesInside = result.schema[key]
				const labelIndise = rulesInside.label ?? 'Este valor'
				rulesInside.label = `${result.prefix ? `${result.prefix} ` : ''}${labelIndise}`

				const result2 = validate(wrapper.value[key], rulesInside)
				if (result2.error == true) {
					errorMessages.push(...result2.messages)
				}
			}
		}
	}

	if (errorMessages.length) {
		return {
			error: true,
			success: false,
			messages: errorMessages
		}
	} else {
		return {
			error: false,
			success: true,
			result: wrapper.value
		}
	}
}

export const rules = () => new Rules

export { RulesEngine } from './rulesEngine'