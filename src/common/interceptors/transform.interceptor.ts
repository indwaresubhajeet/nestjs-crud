import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance, ClassConstructor } from 'class-transformer';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<any, T> {
  constructor(private readonly classType: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return data;
        }

        return Array.isArray(data)
          ? data.map((item) => plainToInstance(this.classType, item))
          : plainToInstance(this.classType, data);
      }),
    );
  }
}
