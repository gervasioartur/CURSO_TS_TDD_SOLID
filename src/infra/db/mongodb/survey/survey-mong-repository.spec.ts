import { MongoHelper } from '../helpers/mongo-helper'
import { SurveyMongoRepository } from './survey-mongo-repository'
import { Collection } from 'mongodb'

const makeSut = (): SurveyMongoRepository => {
    return new SurveyMongoRepository()
}

describe('Survey Mongo repo', () => {
    let surveyColletion: Collection
    beforeAll(async () => {
        await MongoHelper.connect(process.env.MONGO_URL || '')
    })

    afterAll(async () => {
        await MongoHelper.disconnect()
    })

    beforeEach(async () => {
        surveyColletion = await MongoHelper.getCollection('surveys')
        await surveyColletion.deleteMany({})
    })

    describe('Add()', () => {
        it('should add asurvey on success', async () => {
            const sut = makeSut()
            await sut.add({
                question: 'any_question',
                answers: [
                    {
                        image: 'any_image',
                        answer: 'any_answer'
                    },
                    {
                        answer: 'any_answer_2'
                    }
                ],
                date: new Date()
            })
            const survey = await surveyColletion.findOne({ question: 'any_question' })
            expect(survey).toBeTruthy()
        })
    })

    describe('LaodAll()', () => {
        it('should load survey on success', async () => {
            await surveyColletion.insertMany([
                {
                    question: 'any_question',
                    answers: [
                        {
                            image: 'any_image',
                            answer: 'any_answer'
                        },
                        {
                            answer: 'any_answer_2'
                        }
                    ],
                    date: new Date()
                },

                {
                    question: 'any_question_1',
                    answers: [
                        {
                            image: 'any_image',
                            answer: 'any_answer'
                        },
                        {
                            answer: 'any_answer_2'
                        }
                    ],
                    date: new Date()
                }
            ])

            const sut = makeSut()
            const surveys = await sut.loadAll()
            expect(surveys.length).toBe(2)
            expect(surveys[0].question).toBe('any_question')
            expect(surveys[1].question).toBe('any_question_1')
        })
    })
})