import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingScreenComponent } from './drawing-screen.component';

describe('DrawingScreenComponent', () => {
  let component: DrawingScreenComponent;
  let fixture: ComponentFixture<DrawingScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrawingScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
