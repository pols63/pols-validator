import { PRulesEngine, PRulesWrapper } from "./rulesEngine"
import { PDate } from "pols-date"
import { sanitize } from 'isomorphic-dompurify'
import { PUtilsNumber, PUtilsString } from "pols-utils"

const isObject = (context: PRules, wrapper: PRulesWrapper, schema?: Record<string, PRules>) => {
	const message = `'${wrapper.label}' debe ser un objeto`

	if (typeof wrapper.value == 'string') {
		try {
			wrapper.value = JSON.parse(wrapper.value)
		} catch {
			return message
		}
		if (wrapper.value == null || typeof wrapper.value != 'object') return message
	} else if (wrapper.value != null) {
		if (typeof wrapper.value != 'object') return message
	} else {
		return message
	}

	/* Realiza la validación de cada propiedad */
	const newWrapperValue: Record<string, unknown> = {}
	const errorMessages: string[] = []
	for (const key in schema) {
		const rulesInside = schema[key]
		const labelIndise = rulesInside.label ?? key
		rulesInside.label = `${context.label ? `${context.label}${context.separator}` : ''}${labelIndise}`

		const result2 = rulesInside.validate(wrapper.value[key], false)
		if (result2.error == true) {
			errorMessages.push(...result2.messages)
		} else {
			if (result2.result !== undefined) newWrapperValue[key] = result2.result
		}
	}
	if (errorMessages.length) {
		return errorMessages
	} else {
		wrapper.value = newWrapperValue
	}
}

export class PRules extends PRulesEngine {
	isAlphanumeric() {
		this.add(this.isAlphanumeric.name, (wrapper: PRulesWrapper) => {
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
		this.add(this.isEmailAddress.name, (wrapper: PRulesWrapper) => {
			if (!(wrapper.value as string).match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) return `'${wrapper.label}' debe ser una dirección de correo`
		})
		return this
	}

	isDateTime() {
		this.add(this.isDateTime.name, (wrapper: PRulesWrapper) => {
			const message = `'${wrapper.label}' tiene un formato de fecha y hora no válido`
			const newDate = new PDate(wrapper.value)
			if (newDate.isInvalidDate) return message
			wrapper.value = newDate
		})
		return this
	}

	isDate() {
		return this.isDateTime().add(this.isDate.name, (wrapper: PRulesWrapper<PDate>) => {
			wrapper.value.clearClockTime()
		})
	}

	isTime() {
		this.add(this.isTime.name, (wrapper: PRulesWrapper) => {
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
					if (hours >= 1 && hours <= 12) {
						if (middle === 'p') hours += 12
						wrapper.value = `${PUtilsString.padStart(hours, 2)}:${PUtilsString.padStart(minutes, 2)}:${PUtilsString.padStart(seconds, 2)}`
						return
					}
				} else if (hours >= 0 && hours <= 23) {
					wrapper.value = `${PUtilsString.padStart(hours, 2)}:${PUtilsString.padStart(minutes, 2)}:${PUtilsString.padStart(seconds, 2)}`
					return
				}
			}
			return message
		})
		return this
	}

	match(pattern: RegExp) {
		this.isAlphanumeric()
		this.add(this.match.name, (wrapper: PRulesWrapper) => {
			if (!(wrapper.value as string).match(pattern)) return `'${wrapper.label}' no cumple con el formato de texto deseado`
		})
		return this
	}

	isNumber() {
		this.add(this.isNumber.name, (wrapper: PRulesWrapper) => {
			const message = `'${wrapper.label}' debe ser un número`
			const value = Number(wrapper.value)
			if (isNaN(value) || value == Infinity) return message
			wrapper.value = value
		})
		return this
	}

	isInteger() {
		this.isNumber()
		this.add(this.isInteger.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value != Math.floor(wrapper.value as number)) return `'${wrapper.label}' debe ser un número entero`
		})
		return this
	}

	isNatural() {
		return this.isInteger().isGte(0)
	}

	isNaturalNoZero() {
		return this.isInteger().isGt(0)
	}

	onlyNumbers() {
		this.isAlphanumeric()
		this.add(this.onlyNumbers.name, (wrapper: PRulesWrapper) => {
			if (!(wrapper.value as string).match(/^[0-9]+$/)) return `'${wrapper.label}' debe contener sólo números`
		})
		return this
	}

	maxLength(limit: number) {
		return this.add(this.maxLength.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value instanceof Array) {
				return wrapper.value.length > limit ? `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'elementos' : 'elementos'}' como máximo` : null
			} else if (typeof wrapper.value == 'string') {
				return wrapper.value.length > limit ? `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}' como máximo` : null
			} else {
				return `'${wrapper.label}' no es de un tipo válido`
			}
		})
	}

	minLength(limit: number) {
		return this.add(this.minLength.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value instanceof Array) {
				return wrapper.value.length < limit ? `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'elementos' : 'elementos'}' como mínimo` : null
			} else if (typeof wrapper.value == 'string') {
				return wrapper.value.length < limit ? `'${wrapper.label}' debe contener '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}' como mínimo` : null
			} else {
				return `'${wrapper.label}' no es de un tipo válido`
			}
		})
	}

	hasFixedLength(limit: number) {
		return this.add(this.hasFixedLength.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value instanceof Array) {
				return wrapper.value.length < limit ? `'${wrapper.label}' debe contener sólo '${limit} ${limit == 1 ? 'elementos' : 'elementos'}'` : null
			} else if (typeof wrapper.value == 'string') {
				return wrapper.value.length < limit ? `'${wrapper.label}' debe contener sólo '${limit} ${limit == 1 ? 'caracter' : 'caracteres'}'` : null
			} else {
				return `'${wrapper.label}' no es de un tipo válido`
			}
		})
	}

	left(limit: number) {
		return this.isAlphanumeric().add(this.left.name, (wrapper: PRulesWrapper) => {
			(wrapper.value as string) = (wrapper.value as string).substring(0, limit)
		})
	}

	isArray(rulesGenerator?: (index: number) => PRules) {
		return this.add(this.isArray.name, (wrapper: PRulesWrapper<unknown[]>) => {
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

			if (!rulesGenerator) return

			/* Si se ha definido un generador de reglas, se itera cada elemento */
			const messages: string[] = []
			for (const [i, element] of wrapper.value.entries()) {
				const rules = rulesGenerator(i)
				rules.label = `${this.label ? `${this.label}${rules.label ? this.separator : ''}` : ''}${rules.label ?? ''}`
				const result = rules.validate(element, false)
				if (result.error == true) {
					messages.push(...result.messages)
				} else {
					wrapper.value[i] = result.result
				}
			}
			if (messages.length) return messages
		})
	}

	isIn(...elements: unknown[]) {
		return this.add(this.isIn.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value instanceof Array) {
				for (const v of wrapper.value) {
					if (!elements.includes(v)) return `'${wrapper.label}' no contiene valores válidos`
				}
			} else {
				if (!elements.includes(wrapper.value)) return `'${wrapper.label}' no tiene un valor válido`
			}
		})
	}

	isNotIn(...elements: unknown[]) {
		return this.add(this.isNotIn.name, (wrapper: PRulesWrapper) => {
			if (elements.includes(wrapper.value)) return `'${wrapper.label}' no tiene un valor válido`
		})
	}

	hasElements(rulesGenerator?: (index: number) => PRules) {
		return this.isArray(rulesGenerator).add(this.hasElements.name, (wrapper: PRulesWrapper<unknown[]>) => {
			if (!wrapper.value.length) return `'${wrapper.label}' debe contenedor al menos un elemento`
		})
	}

	isGt(limit: number) {
		return this.isNumber().add(this.isGt.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value as number <= limit) return `'${wrapper.label}' debe ser mayor a '${limit}'`
		})
	}

	isGte(limit: number) {
		return this.isNumber().add(this.isGte.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value as number < limit) return `'${wrapper.label}' debe ser mayor o igual a '${limit}'`
		})
	}

	isLt(limit: number) {
		return this.isNumber().add(this.isLt.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value as number >= limit) return `'${wrapper.label}' debe ser menor a '${limit}'`
		})
	}

	isLte(limit: number) {
		return this.isNumber().add(this.isLte.name, (wrapper: PRulesWrapper) => {
			if (wrapper.value as number > limit) return `'${wrapper.label}' debe ser menor o igual a '${limit}'`
		})
	}

	beforeOrSameAsNow() {
		return this.isDateTime().add(this.beforeOrSameAsNow.name, (wrapper: PRulesWrapper<PDate>) => {
			const now = new PDate
			if (wrapper.value.timestamp > now.timestamp) return `'${wrapper.label}' debe ser anterior o igual a 'ahora'`
		})
	}

	isObject(schema?: Record<string, PRules>) {
		return this.add(this.isObject.name, (wrapper: PRulesWrapper) => {
			return isObject(this, wrapper, schema)
		})
	}

	isBoolean() {
		return this.add(this.isBoolean.name, (wrapper: PRulesWrapper) => {
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
	}

	upper() {
		this.isAlphanumeric()
		this.add(this.upper.name, (wrapper: PRulesWrapper) => {
			wrapper.value = (wrapper.value as string).toUpperCase()
		})
		return this
	}

	lower() {
		this.isAlphanumeric()
		this.add(this.lower.name, (wrapper: PRulesWrapper) => {
			wrapper.value = (wrapper.value as string).toLowerCase()
		})
		return this
	}

	decodeURI() {
		this.isAlphanumeric()
		this.add(this.decodeURI.name, (wrapper: PRulesWrapper) => {
			wrapper.value = decodeURI(wrapper.value as string)
		})
		return this
	}

	round(decimals: number) {
		this.isNumber()
		this.add(this.round.name, (wrapper: PRulesWrapper) => {
			wrapper.value = PUtilsNumber.round(wrapper.value as number, decimals)
		})
		return this
	}

	/* Reemplaza todos los dobles (o más) espacios juntos por uno simple */
	cleanDoubleSpaces() {
		this.isAlphanumeric()
		this.add(this.cleanDoubleSpaces.name, (wrapper: PRulesWrapper) => {
			wrapper.value = (wrapper.value as string).replace(/\s{2,}/g, ' ')
		})
		return this
	}

	noSpaces() {
		this.isAlphanumeric()
		this.add(this.noSpaces.name, (wrapper: PRulesWrapper) => {
			if ((wrapper.value as string).match(/\s/)) return `'${wrapper.label}' no debe contener 'espacios'`
		})
		return this
	}


	replace(search: string | RegExp, replace: string | ((substring: string, ...args: any[]) => string)) {
		return this.isAlphanumeric().add(this.replace.name, (wrapper: PRulesWrapper) => {
			wrapper.value = (wrapper.value as string).replace(search, replace as any)
		})
	}

	capitalize() {
		this.isAlphanumeric()
		this.add(this.capitalize.name, (wrapper: PRulesWrapper) => {
			wrapper.value = PUtilsString.capitalize(wrapper.value as string)
		})
		return this
	}

	split(separator: string | RegExp) {
		return this.isAlphanumeric().add(this.split.name, (wrapper: PRulesWrapper<string>) => {
			wrapper.value = wrapper.value.split(separator) as any
		})
	}

	join(separator: string) {
		return this.isArray().add(this.join.name, (wrapper: PRulesWrapper<unknown[]>) => {
			wrapper.value = wrapper.value.join(separator) as any
		})
	}

	floor() {
		return this.isNumber().add(this.floor.name, (wrapper: PRulesWrapper<number>) => {
			wrapper.value = Math.floor(wrapper.value)
		})
	}

	ceil() {
		return this.isNumber().add(this.ceil.name, (wrapper: PRulesWrapper<number>) => {
			wrapper.value = Math.ceil(wrapper.value)
		})
	}

	sanitize(...allowedTags: string[]) {
		return this.isAlphanumeric().add(this.sanitize.name, (wrapper: PRulesWrapper) => {
			wrapper.value = sanitize((wrapper.value as string).trim(), { ALLOWED_TAGS: allowedTags })
		})
	}
}