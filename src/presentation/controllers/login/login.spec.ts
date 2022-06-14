import { LogControllerDecorator } from "../../../main/decorators/log"
import { MissingParamError } from "../../../presentation/errors"
import { badRequest } from "../../../presentation/helpers/http-helper"
import { EmailValidator } from "../sing-up"
import { LoginController } from "./login"

interface SutTypes {
    sut: LoginController
    emailValidatorStub: EmailValidator
}

const makeEmailValidator = (): EmailValidator => {
    class EmailValidatorStub implements EmailValidator {
     isValid (email: string): boolean {
         return true
     }
    }
    return new EmailValidatorStub()
}

const makeSut = (): SutTypes => {
    const emailValidatorStub = makeEmailValidator()
    const sut = new LoginController(emailValidatorStub)
    return {
        sut,
        emailValidatorStub
    }
}
describe('Login Controller',() => {
    it('Should return 400 if no email is privided',async () => {
        const { sut } = makeSut()
        const httpRequest = {
            body: {
                password: "any_password"
            }
        }
        const httpResponse = await sut.handle(httpRequest)
        expect(httpResponse).toEqual(badRequest(new MissingParamError('email')))
    })

    it('Should return 400 if no password is privided',async () => {
        const { sut } = makeSut()
        const httpRequest = {
            body: {
                email: "any_email@email.com"
            }
        }
        const httpResponse = await sut.handle(httpRequest)
        expect(httpResponse).toEqual(badRequest(new MissingParamError('password')))
    })

    it('Should should call email validator with correct email',async () => {
        const { sut, emailValidatorStub } = makeSut()
        const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid')
        const httpRequest = {
            body: {
                email: "any_email@email.com",
                password: "any_password"
            }
        }
        await sut.handle(httpRequest)
        expect(isValidSpy).toHaveBeenCalledWith("any_email@email.com")
    })
})