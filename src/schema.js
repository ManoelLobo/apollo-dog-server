// Welcome to Launchpad!
// Log in to edit and save pads, run queries in GraphiQL on the right.
// Click "Download" above to get a zip with a standalone Node.js server.
// See docs and examples at https://github.com/apollographql/awesome-launchpad

// graphql-tools combines a schema string with resolvers.
import { makeExecutableSchema } from 'graphql-tools';
import fetch from 'node-fetch';
import { unique } from 'shorthash';
import _ from 'lodash'

const API = 'https://dog.ceo/api'

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    dogs: [Dog]
		dog(breed: String!): Dog
  }

	type Dog @cacheControl(maxAge: 1000) {
		id: String!
		breed: String!
		displayImage: String
		images: [Image]
		subbreeds: [String]
	}

	type Image @cacheControl(maxAge: 1000) {
		url: String!
		id: String!
	}
`;

const createDog = (subbreeds, breed) => ({
	breed,
  id: unique(breed),
  subbreeds: subbreeds.length > 0 ? subbreeds : null
})

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    dogs: async () => {
      const results = await fetch(`${API}/breeds/list/all`)
      const { message: dogs } = await results.json()
      
      return _.map(dogs, createDog)
    },
    dog: async (root, { breed }) => {
      const results = await fetch(`${API}/breed/${breed}/list`)
      const { message: subbreeds } = await results.json()
      
      return createDog(subbreeds, breed)
    }
  },
  Dog: {
    displayImage: async ({ breed }) => {
    	const results = await fetch(`${API}/breed/${breed}/images/random`)
      const { message: image } = await results.json()
      return image
    },
  	images: async ({ breed }) => {
    	const results = await fetch(`${API}/breed/${breed}/images`)
      const { message: images } = await results.json()
      return images.map(image => ({ url: image, id: unique(image) }))
    }
  }
};

// Required: Export the GraphQL.js schema object as "schema"
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Optional: Export a function to get context from the request. It accepts two
// parameters - headers (lowercased http headers) and secrets (secrets defined
// in secrets section). It must return an object (or a promise resolving to it).
export function context(headers, secrets) {
  return {
    headers,
    secrets,
  };
};
