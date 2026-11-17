import { TUTOR_MAX, TUTOR_MIN, tutorPose, tutorX } from '../src/features/content/tutor';

describe('tutorPose', () => {
  it('greets on the title slide', () => {
    expect(tutorPose({ type: 'title' }, false, 400).mood).toBe('idle');
  });

  it('talks on the other slides and cheers when the reel is done', () => {
    expect(tutorPose({ type: 'code' }, false, 400).mood).toBe('talk');
    expect(tutorPose({ type: 'code' }, true, 400).mood).toBe('cheer');
  });

  it('grows to fill an empty slide, up to the largest size', () => {
    expect(tutorPose({ type: 'text' }, false, 1000)).toMatchObject({ spot: 'center', size: TUTOR_MAX });
    const mid = tutorPose({ type: 'text' }, false, 200);
    expect(mid.spot).toBe('center');
    expect(mid.size).toBeLessThan(200);
    expect(mid.size).toBeGreaterThan(TUTOR_MIN);
  });

  it('steps aside, small, when the slide is full', () => {
    expect(tutorPose({ type: 'code' }, false, 60)).toMatchObject({ spot: 'right', size: TUTOR_MIN });
    expect(tutorPose({ type: 'visual' }, false, -30)).toMatchObject({ spot: 'right', size: TUTOR_MIN });
  });
});

describe('tutorX', () => {
  it('centers the box', () => {
    expect(tutorX({ mood: 'talk', spot: 'center', size: 100 }, 300, 200)).toBe(50);
  });

  it('keeps the scaled fox flush with the right edge', () => {
    const x = tutorX({ mood: 'talk', spot: 'right', size: 50 }, 300, 200);
    // Scaled around its center, the drawn right edge is x + 100 + 25.
    expect(x + 125).toBe(300);
  });
});
