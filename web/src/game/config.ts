export const movementConfig = {
  fixedStep: 1 / 60,
  radius: 0.35,
  halfHeight: 0.35,
  contactOffset: 0.02,
  normalNudge: 0.005,
  walkSpeed: 4.5,
  sprintSpeed: 6.5,
  jumpSpeed: 7.5,
  gravity: -20,
  terminalVelocity: -24,
  pickupRadius: 0.85,
} as const;
