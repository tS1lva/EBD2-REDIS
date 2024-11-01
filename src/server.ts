import express from "express";
import { Request, Response, Router } from "express";
import {ProductsRepository} from "./ProductsRepository";
import { Product } from "./product";

const app = express();
const port = 3000;
const routes = Router();

const productsRepo = new ProductsRepository();

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 200;
    res.send("Funcionando...");
});

routes.get('/getAllProducts', async(req: Request, res: Response)=>{
    // obter todos os produtos.
    const products = await productsRepo.getAll();
    res.statusCode = 200; 
    res.type('application/json')
    res.send(products);
});

routes.get('/getById/:id', async(req: Request, res: Response)=>{
    //obter o produto pelo id.
    const id = Number(req.params.id)
    const products = await productsRepo.getById(id);
    res.statusCode = 200;
    res.type('application/json')
    res.send(products)
})

routes.post('/create', async (req: Request, res: Response) => {
    const { name, price, description } = req.body;
    const productData: Product = { name, price: Number(price), description } as Product;
    const newProduct = await productsRepo.create(productData);
    res.send(newProduct);
});

routes.put('/update/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, price, description } = req.body;
    const productData: Product = { id, name, price: Number(price), description } as Product;
    const updatedProduct = await productsRepo.update(productData);
    res.send(updatedProduct);
});

routes.delete('/delete/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const affectedRows = await productsRepo.delete(id);
    affectedRows > 0 ? res.send("Produto excluído") : res.send("Produto não encontrado");
});

app.use(express.json())
// aplicar as rotas na aplicação web backend. 
app.use(routes);

app.listen(3000, ()=>{
    console.log("Server is running on 3000");
});