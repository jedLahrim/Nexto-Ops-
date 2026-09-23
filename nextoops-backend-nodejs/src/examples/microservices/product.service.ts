import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Constant } from '../../commons/constant';

@Injectable()
export class MicroservicesProductService {
    constructor(
        @Inject(Constant.PRODUCT_SERVICE) private readonly client: ClientProxy,
    ) { }

    async createProduct(data: any) {
        // todo send() is used for Request-Response pattern
        return this.client.send({ cmd: 'create_product' }, data);
    }

    async getProduct(id: string) {
        return this.client.send({ cmd: 'get_product' }, { id });
    }
}
