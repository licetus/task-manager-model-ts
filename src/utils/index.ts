// import pg, { ClientConfig, Client as PgClient } from 'pg'
// import { resolve } from 'dns';
// import { rejects } from 'assert';

// class Client {
//   public client: PgClient
//   public query: Function

//   constructor(config: ClientConfig) {
//     this.client = new pg.Client(config)
//     this.client.connect((error) => {
//       if (error) throw error
//     })
//     this.query = function () {
//       const slice = ([] as any[]).slice
//       const args = slice.call(arguments)
//       return new Promise((resolve, reject) => {
//         const cb = (error: any, result: any) => {
//           if (error) reject(error)
//           else resolve(result)
//         }
//         args.push(cb)
//         this.client.query.apply(this.client, args)
//       })
//     }
//   }

// }


// const util = {
//   pgAsPromise: {
//     Client,
//   },
// }

// export default util
