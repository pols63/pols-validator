export type RulesParams = {
	label?: string
} & ({
	required?: boolean
} | {
	default?: unknown
})

export type ValidationFunction = (wrapper: Wrapper, ...args: unknown[]) => string | string[] | void | null | undefined

export type Wrapper<T = unknown> = {
	value: T
	label: string
}

export class RulesEngine {
	constructor(params?: RulesParams) {
		if (!params) return
		this.label = params.label
		this.required = 'required' in params ? params.required : false
		this.default = 'default' in params ? params.default : null
	}

	label: string
	required: boolean = false
	default: unknown = null
	collection: Record<string, ValidationFunction> = {}

	protected add(name: string, validationFunction: ValidationFunction) {
		if (!this.collection[name]) this.collection[name] = validationFunction
		return this
	}
}