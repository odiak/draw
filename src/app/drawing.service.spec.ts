import { TestBed } from '@angular/core/testing';

import { DrawingService } from './drawing.service';

describe('DrawingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DrawingService = TestBed.get(DrawingService);
    expect(service).toBeTruthy();
  });
});
