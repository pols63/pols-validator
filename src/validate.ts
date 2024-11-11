import { PUtils } from "pols-utils"
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

	if (typeof target == 'string') target = target.trim()

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
		value: PUtils.clone(target) as T,
		label
	}
	for (const validationFunction of Object.values(rules.collection)) {
		const result = validationFunction(wrapper)
		if (!result) continue
		if (typeof result == 'string') {
			errorMessages.push(result)
			break
		} else {
			errorMessages.push(...result)
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