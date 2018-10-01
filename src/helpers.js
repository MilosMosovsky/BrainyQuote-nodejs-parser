import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import { createObjectCsvWriter } from 'csv-writer'
import { XmlEntities } from 'html-entities'

const entities = new XmlEntities()

const TOTAL_PAGES = 10

export const TOPICS = {
  BUSSINESS: {
    typ: 'topic',
    langc: 'en',
    v: '8.4.1:2962932',
    ab: 'b',
    id: 't:132568',
    vid: '758c0d77bd02e19d921362183e69f763',
    fdd: 'd',
    m: 0
  }
}

function requestWriter (topic = 'output') {
  return createObjectCsvWriter({
    path: `output/${topic}.csv`,
    header: ['quote']
  })
}

function buildBody (page = 1, topic = TOPICS.BUSSINESS) {
  return JSON.stringify({
    ...topic,
    pg: page
  })
}

function parseQuote (quoteBody) {
  const text = entities.decode(quoteBody.childNodes[0].rawText)
  return text
}

function getPageForCategory (
  page = 1,
  category = TOPICS.BUSSINESS,
  finalQuotes
) {
  return new Promise((resolve, reject) => {
    fetch('https://www.brainyquote.com/api/inf', {
      method: 'POST',
      body: buildBody(page, category)
    })
      .then(res => res.json())
      .then(res => {
        const html = parse(res.content)
        const quotes = html.querySelectorAll('a')

        quotes.forEach(quoteBody => {
          if (quoteBody.classNames.includes('b-qt')) {
            const quote = parseQuote(quoteBody)
            finalQuotes.push({
              quote
            })
          }
        })
        resolve()
      })
  })
}

export default function parseTopic (
  topic = TOPICS.BUSSINESS,
  pages = 1,
  name = 'business'
) {
  const finalQuotes = []
  const promises = []

  for (let i = 1; i <= pages; i++) {
    promises.push(getPageForCategory(i, topic, finalQuotes))
  }

  Promise.all(promises).then(() => {
    requestWriter(name)
      .writeRecords(finalQuotes) // returns a promise
      .then(() => {
        console.log(
          `${finalQuotes.length} ${name} quotes written to output/${name}.csv`
        )
      })
  })
}
