import { EmailValidator, AddAccount, AccountModel, AddAccountModel, HttpRequest,Validation } from './singup-protocols'
import { SingUpController } from './singup'
import { MissingParamError, InvalidParamError, ServerError } from '../../errors'
import { ok, badRequest } from '../../helpers/http-helper'

const makeEmailValidator = (): EmailValidator => {
    class EmailValidatorStub implements EmailValidator {
        isValid (email: string): boolean {
            return true
        }
    }
    return new EmailValidatorStub()
}

const makeFakeRequest = (): HttpRequest => ({
    body: {
        name: "any_name",
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
    }
})

const makeEmailValidatorWithError = (): EmailValidator => {
    class EmailValidatorStub implements EmailValidator {
        isValid (email: string): boolean {
            throw new Error()
        }
    }
    return new EmailValidatorStub()
}

const makeaddAccount = (): AddAccount => {
    class AddAccountStub implements AddAccount {
        async add (account: AddAccountModel): Promise<AccountModel> {
            return new Promise(resolve => resolve(makefakeAccount()))
        }
    }
    return new AddAccountStub()
}

const makeValidation = (): Validation => {
    class ValidationStub implements Validation {
         validate (input: any): Error {
            return null
        }
    }
    return new ValidationStub()
}
interface SutTypes {
    sut: SingUpController
    emailValidatorStub: EmailValidator
    addAccountStub: AddAccount
    validationStub: Validation
}

const makefakeAccount = (): AccountModel => ({
    id: 'valid_id',
    name: 'valid_name',
    email: 'valid_email',
    password: 'valid_password'
})

const makeSut = (): SutTypes => {
    const emailValidatorStub = makeEmailValidator()
    const addAccountStub = makeaddAccount()
    const validationStub = makeValidation()
    const sut = new SingUpController(emailValidatorStub, addAccountStub,validationStub)
    return {
        sut,
        emailValidatorStub,
        addAccountStub,
        validationStub
    }
}

describe('Sing up controller', () => {
    it('should retun 400 if the email invalid', async () => {
        const { sut, emailValidatorStub } = makeSut()
        jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(httpResponse).toEqual(badRequest(new InvalidParamError('email')))
    })

    it('should call EmailValidator with correct email', async () => {
        const { sut, emailValidatorStub } = makeSut()
        const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid')
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(isValidSpy).toHaveBeenLastCalledWith('any_email@email.com')
    })

    it('should retun 500 if  EmailValidator throws', async () => {
        const { sut, emailValidatorStub } = makeSut()
        jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
            throw new Error()
        })
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError(null))
    })

    it('should call add account with correct values', async () => {
        const { sut, addAccountStub } = makeSut()
        const addSpy = jest.spyOn(addAccountStub, 'add')
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(addSpy).toHaveBeenLastCalledWith({
            name: "any_name",
            email: 'any_email@email.com',
            password: 'any_password'
        })
    })

    it('should retun 500 if  addAcount throws', async () => {
        const { sut, addAccountStub } = makeSut()
        jest.spyOn(addAccountStub, 'add').mockImplementationOnce(async () => {
            return new Promise((resolve, reject) => reject(new Error()))
        })
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError(null))
    })

    it('should retun 200 if valid data is provided', async () => {
        const { sut } = makeSut()
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(httpResponse).toEqual(ok(makefakeAccount()))
    })

    it('should call Validation with correct value', async () => {
        const { sut, validationStub } = makeSut()
        const validateSpy = jest.spyOn(validationStub, 'validate')
        const httpRequest = makeFakeRequest()
        await sut.handle(httpRequest)
        expect(validateSpy).toHaveBeenLastCalledWith(httpRequest.body)
    })

    it('should retun 400 if validation return an error', async () => {
        const { sut , validationStub } = makeSut()
        jest.spyOn(validationStub, 'validate').mockReturnValueOnce(new MissingParamError('any_field'))
        const httpResponse = await sut.handle(makeFakeRequest())
        expect(httpResponse).toEqual(badRequest(new MissingParamError('any_field')))
    })
})