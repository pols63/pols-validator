import { PDate, PUtils } from "pols-utils"
import { RulesEngine, Wrapper } from "./rulesEngine"
import { validate } from "./validate"

const isObject = (wrapper: Wrapper, schema?: Record<string, RulesEngine>, prefix?: string) => {
	const message = `'${wrapper.label}' debe ser un objeto`

	if (typeof wrapper.value == 'string') {
		try {
			wrapper.value = JSON.parse(wrapper.value)
		} catch {
			return message
		}
		if (PUtils.getType(wrapper.value) != 'Object') return message
	} else {
		if (PUtils.getType(wrapper.value) != 'Object') {
			return message
		}
	}

	/* Realiza la validación de cada propiedad */
	const newWrapperValue: Record<string, unknown> = {}
	const errorMessages: string[] = []
	for (const key in schema) {
		const rulesInside = schema[key]
		const labelIndise = rulesInside.label ?? key
		rulesInside.label = `${prefix ?? ''}${labelIndise}`

		newWrapperValue[key] = wrapper.value[key]

		const result2 = validate(newWrapperValue[key], rulesInside)
		if (result2.error == true) {
			errorMessages.push(...result2.messages)
		} else {
			newWrapperValue[key] = result2.result
		}
	}
	if (errorMessages.length) {
		return errorMessages
	} else {
		wrapper.value = newWrapperValue
	}
}

export class Rules extends RulesEngine {
	isAlphanumeric() {
		this.add(this.isAlphanumeric.name, (wrapper: Wrapper) => {
			if (typeof wrapper.value == 'number') {
				wrapper.value = wrapper.value.toString()
			} else if (typeof wrapper.value != 'string') {
				return `'${wrapper.label}' debe ser un alfanumérico`
			}
		})
		return this
	}

	isEmailAddress() {
		this.isAlphanumeric()
		this.add(this.isEmailAddress.name, (wrapper: Wrapper) => {
			if (!(wrapper.value as string).match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) return `'${wrapper.label}' debe ser una dirección de correo`
		})
		return this
	}

	isDateTime() {
		this.add(this.isDateTime.name, (wrapper: Wrapper) => {
			const message = `'${wrapper.label}' tiene un formato de fecha y hora no válido`
			if (typeof wrapper.value == 'string' || typeof wrapper.value == 'number' || wrapper.value instanceof Date || wrapper.value instanceof PDate) {
				const newDate = new PDate(wrapper.value)
				if (newDate.isInvalidDate) return message
				wrapper.value = newDate
			} else {
				return message
			}
		})
		return this
	}

	isDate() {
		return this.isDateTime().add(this.isDate.name, (wrapper: Wrapper<PDate>) => {
			wrapper.value.clearTime()
		})
	}

	isTime() {
		this.add(this.isTime.name, (wrapper: Wrapper) => {
			const message = `'${wrapper.label}' contiene un formato de hora no válido`
			const value = wrapper.value.toString()
			const parts = value.replace(/[.,]/g, ':').replace('m', '').match(/^([0-2]?[0-9])(:?)([0-5]?[0-9]?)(:?)([0-5]?[0-9]?)([ap]?)\.?m?\.?$/)
			if (!parts) return message
			let hours = Number(parts[1])
			const minutes = Number(parts[3])
			const seconds = Number(parts[5])
			const middle = parts[6]
			if (minutes < 60 && seconds < 60) {
				/* Si middle es diferente de vacío, es porque el usuario tiene la intención de especificar una hora del día, caso contrario, está indicando una duración. */
				if (middle) {
					if (hours > 0 && hours <= 12) {
						if (middle === 'p') hours += 12
						wrapper.value = `${PUtils.String.padLeft(hours, 2)}:${PUtils.String.padLeft(minutes, 2)}:${PUtils.String.padLeft(seconds, 2)}`
						return
					}
				} else {
					wrapper.value = `${PUtils.String.padLeft(hours, 2)}:${PUtils.String.padLeft(minutes, 2)}:${PUtils.String.padLeft(seconds, 2)}`
					return
				}
			}
			return message
		})
		return this
	}

	match(pattern: RegExp) {
		this.isAlphanumeric()
		this.add(this.match.name, (wrapper: Wrapper) => {
			if (!(wrapper.value as string).match(pattern)) return `'${wrapper.label}' no cumple con el formato de texto deseado`
		})
		return this
	}

	isNumber() {
		this.add(this.isNumber.name, (wrapper: Wrapper) => {
			const message = `'${wrapper.label}' debe ser un número`
			const value = Number(wrapper.value)
			if (isNaN(value) || value == Infinity) return message
			wrapper.value = value
		})
		return this
	}

	isInteger() {
		this.isNumber()
		this.add(this.isInteger.name, (wrapper: Wrapper) => {
			if (wrapper.value != Math.floor(wrapper.value as number)) return `'${wrapper.label}' debe ser un número entero`
		})
		return this
	}

	isNatural() {
		return this.isInteger().gte(0)
	}

	isNaturalNoZero() {
		return this.isInteger().gt(0)
	}

	onlyNumbers() {
		this.isAlphanumeric()
		this.add(this.onlyNumbers.name, (wrapper: Wrapper) => {
			if (!(wrapper.value as string).match(/^[0-9]+$/)) return `'${wrapper.label}' debe contener sólo números`
		})
		return this
	}

	maxLength(limit: number) {
		this.isAlphanumeric()
		this.add(this.maxLength.name, (wrapper: Wrapper) => {
			if ((wrapper.value as string).length > limit) return `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}' como máximo`
		})
		return this
	}

	// maxCount(limit: number) {
	// 	this.isArray()
	// 	this.add(this.maxLength.name, (wrapper: Wrapper<unknown[]>) => {
	// 		if (wrapper.value.length > limit) return `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'elemento' : 'elementos'}' como máximo`
	// 	})
	// 	return this
	// }

	minLength(limit: number) {
		this.isAlphanumeric()
		this.add(this.minLength.name, (wrapper: Wrapper) => {
			if ((wrapper.value as string).length < limit) return `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}' como mínimo`
		})
		return this
	}

	length(limit: number) {
		this.isAlphanumeric()
		this.add(this.length.name, (wrapper: Wrapper) => {
			if ((wrapper.value as string).length != limit) return `'${wrapper.label}' debe contener sólo '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}'`
		})
		return this
	}

	left(limit: number) {
		this.isAlphanumeric()
		this.add(this.length.name, (wrapper: Wrapper) => {
			(wrapper.value as string) = (wrapper.value as string).substring(0, limit)
		})
		return this
	}

	isArray() {
		return this.add(this.isArray.name, (wrapper: Wrapper) => {
			const message = `'${wrapper.label}' debe ser una lista de elementos`
			if (typeof wrapper.value == 'string') {
				try {
					const value = JSON.parse(wrapper.value)
					if (!(value instanceof Array)) return message
					wrapper.value = value
				} catch (err) {
					return message
				}
			} else {
				if (!(wrapper.value instanceof Array)) return message
			}
		})
	}

	isArrayOfObjects(schema?: (index: number) => Record<string, RulesEngine>, prefix?: (index: number) => string) {
		return this.isArray().add(this.isArrayOfObjects.name, (wrapper: Wrapper<unknown[]>) => {
			const message = `'${wrapper.label}' debe ser una lista de objetos`
			const messages: string[] = []
			if (schema) {
				for (const [i, v] of wrapper.value.entries()) {
					const newWrapper: Wrapper = {
						label: '',
						value: v
					}
				}
			}
			if (messages.length) return messages
		})
	}

	isIn(...elements: unknown[]) {
		this.add(this.isIn.name, (wrapper: Wrapper) => {
			if (wrapper.value instanceof Array) {
				for (const v of wrapper.value) {
					if (!elements.includes(v)) return `'${wrapper.label}' no contiene valores válidos`
				}
			} else {
				if (!elements.includes(wrapper.value)) return `'${wrapper.label}' no tiene un valor válido`
			}
		})
		return this
	}

	isNotIn(...elements: unknown[]) {
		this.add(this.isNotIn.name, (wrapper: Wrapper) => {
			if (elements.includes(wrapper.value)) return `'${wrapper.label}' no tiene un valor válido`
		})
		return this
	}

	// hasElements(checkingElements?: (i: number) => FieldStructure) {
	// 	this.isArray(checkingElements)
	// 	this.add(this.hasElements.name, (wrapper: Wrapper) => {
	// 		if (!(wrapper.value as unknown[]).length) return `'${wrapper.label}' debe ser una lista con al menos un elemento`
	// 	})
	// 	return this
	// }

	gt(limit: number) {
		this.isNumber()
		this.add(this.gt.name, (wrapper: Wrapper) => {
			if (wrapper.value as number <= limit) return `'${wrapper.label}' debe ser mayor a '${limit}'`
		})
		return this
	}

	gte(limit: number) {
		this.isNumber()
		this.add(this.gte.name, (wrapper: Wrapper) => {
			if (wrapper.value as number < limit) return `'${wrapper.label}' debe ser mayor o igual a '${limit}'`
		})
		return this
	}

	lt(limit: number) {
		this.isNumber()
		this.add(this.lt.name, (wrapper: Wrapper) => {
			if (wrapper.value as number >= limit) return `'${wrapper.label}' debe ser menor a '${limit}'`
		})
		return this
	}

	lte(limit: number) {
		return this
			.isNumber()
			.add(this.lte.name, (wrapper: Wrapper) => {
				if (wrapper.value as number > limit) return `'${wrapper.label}' debe ser menor o igual a '${limit}'`
			})
	}

	beforeOrSameAsNow() {
		return this
			.isDateTime()
			.add(this.beforeOrSameAsNow.name, (wrapper: Wrapper<PDate>) => {
				const now = new PDate
				if (wrapper.value.time > now.time) return `'${wrapper.label}' debe ser anterior o igual a 'ahora'`
			})
	}

	isObject(schema?: Record<string, RulesEngine>, prefix?: string) {
		return this.add(this.isObject.name, (wrapper: Wrapper) => {
			return isObject(wrapper, schema, prefix)
		})
	}

	isBoolean() {
		this.add(this.isBoolean.name, (wrapper: Wrapper) => {
			const message = `'${wrapper.label}' debe ser de tipo booleano`
			if (typeof wrapper.value == 'string') {
				const value = wrapper.value.trim().toUpperCase()
				switch (value) {
					case '1':
					case 'S':
					case 'SÍ':
					case 'Y':
					case 'YES':
						wrapper.value = true
						return
					case '0':
					case 'N':
					case 'NO':
						wrapper.value = false
						return
					default: {
						let json
						try {
							json = JSON.parse(wrapper.value)
						} catch {
							return message
						}
						if (typeof json != 'boolean' && !([0, 1]).includes(json)) return message
						wrapper.value = json
						return
					}
				}
			} else if (typeof wrapper.value == 'number') {
				switch (wrapper.value) {
					case 0:
						wrapper.value = false
						return
					case 1:
						wrapper.value = true
						return
					default:
						return message
				}
			} else {
				return typeof wrapper.value == 'boolean' ? null : message
			}
		})
		return this
	}

	upper() {
		this.isAlphanumeric()
		this.add(this.upper.name, (wrapper: Wrapper) => {
			wrapper.value = (wrapper.value as string).toUpperCase()
		})
		return this
	}

	lower() {
		this.isAlphanumeric()
		this.add(this.lower.name, (wrapper: Wrapper) => {
			wrapper.value = (wrapper.value as string).toLowerCase()
		})
		return this
	}

	decodeURI() {
		this.isAlphanumeric()
		this.add(this.decodeURI.name, (wrapper: Wrapper) => {
			wrapper.value = decodeURI(wrapper.value as string)
		})
		return this
	}

	round(decimals: number) {
		this.isNumber()
		this.add(this.round.name, (wrapper: Wrapper) => {
			wrapper.value = PUtils.Number.round(wrapper.value as number, decimals)
		})
		return this
	}

	/* Reemplaza todos los dobles (o más) espacios juntos por uno simple */
	cleanDoubleSpaces() {
		this.isAlphanumeric()
		this.add(this.cleanDoubleSpaces.name, (wrapper: Wrapper) => {
			wrapper.value = (wrapper.value as string).replace(/\s{2,}/g, ' ')
		})
		return this
	}

	noSpaces() {
		this.isAlphanumeric()
		this.add(this.noSpaces.name, (wrapper: Wrapper) => {
			if ((wrapper.value as string).match(/\s/)) return `'${wrapper.label}' no debe contener 'espacios'`
		})
		return this
	}


	replace(search: string | RegExp, replace: string | ((substring: string, ...args: any[]) => string)) {
		return this.isAlphanumeric().add(this.replace.name, (wrapper: Wrapper) => {
			wrapper.value = (wrapper.value as string).replace(search, replace as any)
		})
	}

	capitalize() {
		this.isAlphanumeric()
		this.add(this.capitalize.name, (wrapper: Wrapper) => {
			wrapper.value = PUtils.String.capitalize(wrapper.value as string)
		})
		return this
	}

	split(separator: string | RegExp) {
		return this.isAlphanumeric().add(this.split.name, (wrapper: Wrapper) => {
			wrapper.value = (wrapper.value as any).split(separator)
		})
	}
}