import { ResultSetHeader } from "mysql2"
import { conn } from "./db"
import { Product } from "./product"
import Redis from "ioredis"
import { resolve } from "path";

const redis = new Redis();

let i = 0;

export class ProductsRepository {

  async getAll(): Promise<Product[]> {
    // tenta buscar todos os produtos no redis se ja foram trazidos do banco
    if (i > 0){
      const cachedProducts = await redis.get("allProducts");
      if (cachedProducts) {
        return JSON.parse(cachedProducts) as Product[];
      }
    }
    
    // faz a primeira execução no banco para sincronizar os dados no redis
    return new Promise((resolve, reject) => {
      conn.query<Product[]>("SELECT * FROM products", async (err, res) => {
        if (err) {
          reject(err);
        } else {
          await redis.set("allProducts", JSON.stringify(res), "EX", 300);
          i++;
          resolve(res);
        }
      });
    });
  }
  

  async getById(product_id: number): Promise<Product | undefined> {
    
    // tenta buscar o produto primeiro no redis
    const cachedProduct = await redis.get(`product:${product_id}`);
    if (cachedProduct) {

      // resposta do redis
      redis.set("testKey", "testValue", (err, reply) => {
        console.log("Resposta do Redis em Busca por Id:", reply);
      });
      
      return JSON.parse(cachedProduct) as Product;
    }

    // caso não encontre busca no banco e insere no redis
    return new Promise((resolve, reject) => {
      conn.query<Product[]>(
        "SELECT * FROM products WHERE id = ?",
        [product_id],
        async (err, res) => {
          if (err) {
            reject(err)
          } else {
            const product = (res?.[0])

            if(product){
              await redis.set(`product:${product_id}`, JSON.stringify(product), "EX", 300);
            }

            resolve(product);
          }
        }
      )
    })
  }

  async create(p: Product): Promise<Product> {
    const newProduct = await new Promise<Product>((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "INSERT INTO products (name, price, description) VALUES(?,?,?)",
        [p.name, p.price, p.description],
        (err, res) => {
          if (err) reject(err)
          else resolve({id: res.insertId, ...p});
        }
      )
    })

    // adiciona o novo produto no redis
    await redis.set(`product:${newProduct.id}`, JSON.stringify(newProduct), "EX", 300);

      // resposta do redis
      redis.set("testKey", "testValue", (err, reply) => {
      console.log("Resposta do Redis Criando Novo Produto:", reply);
    });

    // Deleta o cache com todos os produtos, pois este já não será mais atual
    await redis.del("allProducts");

    return newProduct;
  }

  update(p: Product): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?",
        [p.name, p.price, p.description, p.id],
        async (err, res) => {
          if (err) reject(err)
          else
            // atualiza o produto no redis após ser atualizado no banco
            await redis.set(`product:${p.id}`, JSON.stringify(p), "EX", 300);

            // resposta do redis
            redis.set("testKey", "testValue", (err, reply) => {
              console.log("Resposta do Redis Alterando um Produto:", reply);
            });

            this.getById(p.id!)
              .then(resolve)
              .catch(reject)

            // Deleta o cache com todos os produtos, pois este já não será mais atual
            await redis.del("allProducts");
        }
      )
    })
  }

  delete(product_id: number): Promise<number> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "DELETE FROM products WHERE id = ?",
        [product_id],
        async (err, res) => {
          if (err) reject(err)
          else {
            // remove o produto do redis após ser deletado do banco
            await redis.del(`product:${product_id}`)

            // resposta do redis
            redis.set("testKey", "testValue", (err, reply) => {
              console.log("Resposta do Redis Excluindo um Produto:", reply);
            });

            resolve(res.affectedRows)
            
            // Deleta o cache com todos os produtos, pois este já não será mais atual
            await redis.del("allProducts");
          }
        }
      )
    })
  }
}