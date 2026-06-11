import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Plan } from './plan.entity.js';
import { Feature } from './feature.entity.js';

@Entity('plan_features')
export class PlanFeature {
  @PrimaryColumn({ type: 'uuid' })
  planId!: string;

  @PrimaryColumn({ type: 'uuid' })
  featureId!: string;

  @ManyToOne(() => Plan, (plan) => plan.planFeatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @ManyToOne(() => Feature, (feature) => feature.planFeatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature!: Feature;
}
