import { rules } from '../src/index'

const schemaNoElementLabel = rules({ default: {} }).isObject({
	Aprobadores: rules({ label: 'Lista de Aprobadores', required: true }).isArray(i => rules({ label: `Aprobador ${i + 1}` }).isObject({
		idAprobador: rules({ label: 'ID de Aprobador', required: true }).isString(),
		Etapa: rules({ required: true }).isNaturalNoZero(),
	})).hasElements()
})

const userPayload = {
	Aprobadores: [
		{
		}
	]
}

const validationResultNoElementLabel = schemaNoElementLabel.validate(userPayload) as any
console.log("Aprobadores sin etiqueta de elemento messages:", validationResultNoElementLabel.messages)

console.log("\n¡Pruebas completadas!")