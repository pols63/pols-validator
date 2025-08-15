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

	constructor(label?: string, required?: boolean, _default?: unknown)
	constructor(required?: boolean, _default?: unknown)
	constructor(params?: PRulesParams)
	constructor(a1?: any, a2?: any, a3?: any) {
		if (typeof a1 == 'string') {
			this.label = a1
			this.required = a2 ?? false
			this.default = a3 ?? null
		} else if (typeof a1 == 'boolean') {
			this.required = a1
			this.default = a2 ?? null
		} else {
			this.label = a1?.label
			this.separator = a1?.separator ?? ' > '
			this.required = a1 && 'required' in a1 ? a1?.required : false
			this.default = a1 && 'default' in a1 ? a1?.default : null
		}
	}

	protected add(name: string, validationFunction: PRulesFunction) {
		if (!this.collectionNames.includes(name)) {
			this.collectionNames.push(name)
			this.collectionFunctions.push(validationFunction)
		}
		return this
	}

	validate<T>(target: unknown, safe = true): PRulesResponse<T> {
		const errorMessages: string[] = []

		if (typeof target == 'string') target = target.trim()

		const defaultIsEmpty = this.default == null || (typeof this.default == 'string' && !this.default)
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
			if (!defaultIsEmpty) {
				target = this.default
			} else {
				return {
					error: false,
					success: true,
					result: this.default as T
				}
			}
		}

		const wrapper: PRulesWrapper<T> = {
			value: safe ? JSON.parse(JSON.stringify(target)) : target,
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