import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from 'src/orders/entities/order.entity';
import { CoreOutput } from '../../common/dtos/core-output.dto';

@InputType()
export class EditOrderInput extends PickType(Order, ['id', 'status']) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
