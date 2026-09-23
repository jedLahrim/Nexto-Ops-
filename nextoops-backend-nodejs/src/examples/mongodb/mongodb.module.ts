import { Module } from '@nestjs/common';
import { MongooseModule, Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserMongo extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ unique: true })
    email: string;

    @Prop()
    age: number;
}

export const UserMongoSchema = SchemaFactory.createForClass(UserMongo);

@Module({
    imports: [
        // In a real app, the URI would come from ConfigService
        // MongooseModule.forRoot('mongodb://localhost/nest'),
        MongooseModule.forFeature([{ name: UserMongo.name, schema: UserMongoSchema }]),
    ],
})
export class MongodbModule { }
