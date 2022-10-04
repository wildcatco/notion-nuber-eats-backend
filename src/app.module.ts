import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo/dist/drivers';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { RolesGuard } from './auth/roles.guard';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { JwtModule } from './jwt/jwt.module';
import { MailModule } from './mail/mail.module';
import { Order } from './orders/entities/order.entity';
import { OrdersModule } from './orders/orders.module';
import { Category } from './restaurants/entities/category.entity';
import { Dish } from './restaurants/entities/dish.entity';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { User } from './users/entities/user.entity';
import { Verification } from './users/entities/verification.entity';
import { UsersModule } from './users/users.module';

const nodeEnv = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: nodeEnv === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: nodeEnv === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.required(),
        DB_PORT: Joi.required(),
        DB_USERNAME: Joi.required(),
        DB_PASSWORD: Joi.required(),
        DB_NAME: Joi.required(),
        JWT_SECRET_KEY: Joi.required(),
        MAILGUN_API_KEY: Joi.required(),
        MAILGUN_DOMAIN_NAME: Joi.required(),
        MAILGUN_FROM_EMAIL: Joi.required(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req }) => ({ user: req['user'] }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: nodeEnv !== 'prod',
      logging: nodeEnv === 'dev',
      entities: [User, Verification, Restaurant, Category, Dish, Order],
    }),
    JwtModule.forRoot({
      privateKey: process.env.JWT_SECRET_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    UsersModule,
    RestaurantsModule,
    OrdersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes({
      path: '/graphql',
      method: RequestMethod.ALL,
    });
  }
}
