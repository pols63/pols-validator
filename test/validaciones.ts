import { rules, createRulesCreator, PRules } from '../src/index'

console.log("--- Pruebas originales con renombrado isString ---")
const objeto = {
	Correo: 'asd@asd.com',
	Detalles: [{
		uno: {},
		dos: 'qwe'
	}, {
		uno: 'neo',
		dos: 'bnbn'
	}],
	Elementos: ['asd', 56]
}

const v = rules().isObject({
	Correo: rules().isEmailAddress(),
	Detalles: rules().hasElements(i => rules(`Detalle ${i + 1}`).isObject({
		uno: rules().isString(),
		dos: rules().isNatural()
	})),
	Elementos: rules().isArray(i => rules(`Elemento ${i + 1}`).isNumber())
}).validate(objeto)

console.log("Original validation result:", JSON.stringify(v, null, 2))

console.log("\n--- Pruebas de conversión de hora en isTime ---")
const pmResult = rules().isTime().validate("12:30pm") as any
console.log("12:30pm ->", pmResult.sanitized)
console.assert(pmResult.sanitized === "12:30:00", "ERROR: 12:30pm debería ser 12:30:00")

const amResult = rules().isTime().validate("12:30am") as any
console.log("12:30am ->", amResult.sanitized)
console.assert(amResult.sanitized === "00:30:00", "ERROR: 12:30am debería ser 00:30:00")

const normalPmResult = rules().isTime().validate("1:30pm") as any
console.log("1:30pm ->", normalPmResult.sanitized)
console.assert(normalPmResult.sanitized === "13:30:00", "ERROR: 1:30pm debería ser 13:30:00")

console.log("\n--- Pruebas de longitud exacta en hasFixedLength ---")
const fixedLenGood = rules().hasFixedLength(8).validate("12345678") as any
console.log("8 chars (hasFixedLength 8) -> error:", fixedLenGood.error)
console.assert(fixedLenGood.error === false, "ERROR: 8 caracteres debería ser válido para hasFixedLength(8)")

const fixedLenTooLong = rules().hasFixedLength(8).validate("1234567890") as any
console.log("10 chars (hasFixedLength 8) -> error:", fixedLenTooLong.error)
console.assert(fixedLenTooLong.error === true, "ERROR: 10 caracteres debería ser inválido para hasFixedLength(8)")

console.log("\n--- Pruebas de booleanos en mayúsculas ---")
const boolTrueResult = rules().isBoolean().validate("TRUE") as any
console.log("TRUE -> sanitized:", boolTrueResult.sanitized, "error:", boolTrueResult.error)
console.assert(boolTrueResult.sanitized === true && !boolTrueResult.error, "ERROR: TRUE debería ser true")

const boolFalseResult = rules().isBoolean().validate("FALSE") as any
console.log("FALSE -> sanitized:", boolFalseResult.sanitized, "error:", boolFalseResult.error)
console.assert(boolFalseResult.sanitized === false && !boolFalseResult.error, "ERROR: FALSE debería ser false")

console.log("\n--- Pruebas de reutilización de esquema (mutación de etiquetas) ---")
const itemSchema = rules('Usuario').isObject({
	nombre: rules('Nombre').isString()
})

itemSchema.validate({ nombre: "Jean" })
itemSchema.validate({ nombre: "Sánchez" })
// Let's run a validation that fails to see the error label path
const failedRun = itemSchema.validate({ nombre: {} }) as any
console.log("Mensaje de error (primera falla):", failedRun.messages)
console.assert(failedRun.messages[0] === "'Usuario > Nombre' debe ser una cadena de texto", `ERROR: Etiqueta incorrecta: ${failedRun.messages[0]}`)

const failedRun2 = itemSchema.validate({ nombre: true }) as any
console.log("Mensaje de error (segunda falla):", failedRun2.messages)
console.assert(failedRun2.messages[0] === "'Usuario > Nombre' debe ser una cadena de texto", `ERROR: La etiqueta acumuló prefijos: ${failedRun2.messages[0]}`)

console.log("\n--- Pruebas de isNumeric ---")
const numericGood = rules().isNumeric().validate("1234567890") as any
console.log("1234567890 -> error:", numericGood.error)
console.assert(numericGood.error === false, "ERROR: 1234567890 debería ser numérico válido")

const numericBad = rules().isNumeric().validate("123a456") as any
console.log("123a456 -> error:", numericBad.error)
console.assert(numericBad.error === true, "ERROR: 123a456 debería ser numérico inválido")

console.log("\n--- Pruebas de isAlphanumeric ---")
const alphaGood = rules().isAlphanumeric().validate("User123ñáéíóúüÑÁÉÍÓÚÜ") as any
console.log("User123ñáéíóúüÑÁÉÍÓÚÜ -> error:", alphaGood.error)
console.assert(alphaGood.error === false, "ERROR: Caracteres españoles con números deberían ser alfanuméricos válidos")

const alphaBad = rules().isAlphanumeric().validate("User 123!") as any
console.log("User 123! -> error:", alphaBad.error)
console.assert(alphaBad.error === true, "ERROR: Espacios y símbolos deberían ser alfanuméricos inválidos")

console.log("\n--- Pruebas de .custom() ---")
const customGood = rules("Código").isString().custom((val) => val.startsWith("ABC-"), "Debe comenzar con ABC-").validate("ABC-123") as any
console.log("ABC-123 -> error:", customGood.error)
console.assert(customGood.error === false, "ERROR: ABC-123 debería ser válido")

const customBad = rules("Código").isString().custom((val) => val.startsWith("ABC-"), "Debe comenzar con ABC-").validate("XYZ-123") as any
console.log("XYZ-123 -> error:", customBad.error, "message:", customBad.messages[0])
console.assert(customBad.error === true && customBad.messages[0] === "Debe comenzar con ABC-", "ERROR: XYZ-123 debería ser inválido con mensaje custom")

console.log("\n--- Pruebas de createRulesCreator ---")
class MisReglas extends PRules {
	isDNI() {
		return this.add("isDNI", (wrapper) => {
			if (!(wrapper.value as string).match(/^[0-9]{8}[A-Z]$/)) {
				return `'${wrapper.label}' no es un DNI válido`
			}
		})
	}
}

const myRules = createRulesCreator(MisReglas)

const dniGood = myRules("Documento").isString().isDNI().validate("12345678Z") as any
console.log("12345678Z -> error:", dniGood.error)
console.assert(dniGood.error === false, "ERROR: 12345678Z debería ser un DNI válido")

const dniBad = myRules("Documento").isString().isDNI().validate("123456789Z") as any
console.log("123456789Z -> error:", dniBad.error, "message:", dniBad.messages[0])
console.assert(dniBad.error === true && dniBad.messages[0] === "'Documento' no es un DNI válido", "ERROR: 123456789Z debería ser un DNI inválido")

console.log("\n--- Pruebas de comas y espacios en isNumber ---")
const commaSpaceGood1 = rules().isNumber().validate("1,200") as any
console.log("'1,200' -> sanitized:", commaSpaceGood1.sanitized, "error:", commaSpaceGood1.error)
console.assert(commaSpaceGood1.sanitized === 1200 && !commaSpaceGood1.error, "ERROR: '1,200' debería ser 1200")

const commaSpaceGood2 = rules().isNumber().validate("1 200 300.50") as any
console.log("'1 200 300.50' -> sanitized:", commaSpaceGood2.sanitized, "error:", commaSpaceGood2.error)
console.assert(commaSpaceGood2.sanitized === 1200300.50 && !commaSpaceGood2.error, "ERROR: '1 200 300.50' debería ser 1200300.50")

const commaSpaceGood3 = rules().isNumber().validate(" 1, 200 ") as any
console.log("' 1, 200 ' -> sanitized:", commaSpaceGood3.sanitized, "error:", commaSpaceGood3.error)
console.assert(commaSpaceGood3.sanitized === 1200 && !commaSpaceGood3.error, "ERROR: ' 1, 200 ' debería ser 1200")

console.log("\n--- Pruebas de la incidencia del usuario (Aprobadores) ---")
const schema = rules({ default: {} }).isObject({
	Aprobadores: rules({ label: 'Lista de Aprobadores', required: true }).isArray(i => rules({ label: `Aprobador ${i + 1}` }).isObject({
		idAprobador: rules({ label: 'ID de Aprobador', required: true }).isString(),
		Etapa: rules({ required: true }).isNaturalNoZero(),
	})).hasElements()
})

const userPayload = {
	Aprobadores: [
		{
			Etapa: 1
		}
	]
}

const validationResult = schema.validate(userPayload) as any
console.log("Aprobadores validation result messages:", validationResult.messages)

console.log("\n--- Pruebas de la incidencia del usuario (Aprobadores sin etiqueta de elemento) ---")
const schemaNoElementLabel = rules({ default: {} }).isObject({
	Aprobadores: rules({ label: 'Lista de Aprobadores', required: true }).isArray(i => rules().isObject({
		idAprobador: rules({ label: 'ID de Aprobador', required: true }).isString(),
		Etapa: rules({ required: true }).isNaturalNoZero(),
	})).hasElements()
})

const validationResultNoElementLabel = schemaNoElementLabel.validate(userPayload) as any
console.log("Aprobadores sin etiqueta de elemento messages:", validationResultNoElementLabel.messages)

console.log("\n¡Pruebas completadas!")