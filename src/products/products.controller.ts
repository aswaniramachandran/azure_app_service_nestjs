import { Controller,Post,Get,Body,Param,Patch,Delete } from '@nestjs/common';
import { ProductsService } from './products.service';


@Controller('products')
export class ProductsController {


constructor(
private service:ProductsService
){}



@Post()
create(
@Body() body:any
){

return this.service.create(body);

}



@Get()
findAll(){

return this.service.findAll();

}



@Get(':id')
findOne(
@Param('id') id:number
){

return this.service.findOne(id);

}



@Patch(':id')
update(
@Param('id') id:number,
@Body() body:any
){

return this.service.update(id,body);

}



@Delete(':id')
delete(
@Param('id') id:number
){

return this.service.remove(id);

}



}