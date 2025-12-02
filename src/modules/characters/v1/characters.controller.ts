import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Utils } from '../../../utils';
import { CharactersService } from './characters.service';

@Controller({
  version: '1',
  path: 'characters',
})
export class CharactersController {
  private readonly _limit = 10;

  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  public async findAll(
    @Req() request: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    try {
      const _page = parseInt(page, 10) || undefined;
      let _limit = parseInt(limit, 10) || undefined;

      _limit = _page && !_limit ? this._limit : _limit;

      return await this.charactersService.findAll(
        Utils.getUrlPath(request),
        _page,
        _limit,
      );
    } catch {
      throw new HttpException(
        'Error processing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  public async findOne(@Req() request: Request, @Param('id') id: string) {
    try {
      return await this.charactersService.findOne(
        id,
        Utils.getUrlPath(request),
      );
    } catch {
      throw new HttpException(
        'Error processing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
