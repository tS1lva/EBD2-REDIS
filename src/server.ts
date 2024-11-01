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

routes.get('/create/:name/:price/:description', async(req: Request, res: Response)=>{
    //insere um produto.
    const name = String(req.params.name)
    const price = Number(req.params.price)
    const description = String(req.params.description)

    const parameters: Product = {name: name, price: price, description: description} as Product
    const products = await productsRepo.create(parameters);
    res.statusCode = 200;
    res.type('application/json')
    res.send(products)
})

routes.get('/update/:name/:price/:description/:id', async(req: Request, res: Response)=>{
    //altera um produto.
    const name = String(req.params.name)
    const price = Number(req.params.price)
    const description = String(req.params.description)
    const id = Number(req.params.id)

    const parameters: Product = {name: name, price: price, description: description, id: id} as Product
    const products = await productsRepo.update(parameters);
    res.statusCode = 200;
    res.type('application/json')
    res.send(products)
})

routes.get('/delete/:id', async(req: Request, res: Response)=>{
    //exclui um produto.
    const id = Number(req.params.id)
    
    try {
        const affectedRows = await productsRepo.delete(id);
        if (affectedRows > 0) {
            res.sendStatus(204); 
        } else {
            res.status(404).json({ error: 'Produto não encontrado' });
        }
    } catch (error) {
        console.error(error); 
        res.status(500);
    }
})

// aplicar as rotas na aplicação web backend. 
app.use(routes);

app.listen(3000, ()=>{
    console.log("Server is running on 3000");
});