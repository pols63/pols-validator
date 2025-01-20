import { PUtils } from "pols-utils"

export type PRulesParams = {
	label?: string
	separator?: string
} & ({
	required?: boolean
} | {
	default?: unknown
})

export type PRulesFunction = (wrapper: PRulesWrapper, ...args: unknown[]) => string | string[] | void | null | undefined

export type PRulesWrapper<T = unknown> = {
	value: T
	label: string
}

export type PRulesResponse<T> = {
	error: false
	success: true
	result: T
} | {
	error: true
	success: false
	messages: string[]
}

export class PRulesEngine {
	prefix: string
	label: string
	separator: string
	required: boolean = false
	default: unknown = null

	private collectionFunctions: PRulesFunction[] = []
	private collectionNames: string[] = []

	constructor(params?: PRulesParams) {
		this.label = params?.label
		this.separator = params?.separator ?? ' > '
		this.required = params && 'required' in params ? params?.required : false
		this.default = params && 'default' in params ? params?.default : null
	}

	protected add(name: string, validationFunction: PRulesFunction) {
		if (!this.collectionNames.includes(name)) {
			this.collectionNames.push(name)
			this.collectionFunctions.push(validationFunction)
		}
		return this
	}

	validate = <T>(target: unknown): PRulesResponse<T> => {
		const errorMessages: string[] = []

		if (typeof target == 'string') target = target.trim()

		const isEmpty = target == null || (typeof target == 'string' && !target)
		const label = this.label

		if (this.required && isEmpty) {
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
				result: this.default as T
			}
		}

		const wrapper: PRulesWrapper<T> = {
			value: PUtils.clone(target) as T,
			label
		}
		for (const validationFunction of this.collectionFunctions) {
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
}