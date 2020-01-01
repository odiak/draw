import { TestBed } from '@angular/core/testing';

import { TitleAdapterService } from './title-adapter.service';

describe('TitleAdapterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TitleAdapterService = TestBed.get(TitleAdapterService);
    expect(service).toBeTruthy();
  });
});
