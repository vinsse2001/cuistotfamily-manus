import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiaChat } from './lia-chat';

describe('LiaChat', () => {
  let component: LiaChat;
  let fixture: ComponentFixture<LiaChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiaChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiaChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
