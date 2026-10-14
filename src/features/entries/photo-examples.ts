import type { ImageSourcePropType } from 'react-native';

export type PhotoExample = {
  label: string;
  source(): ImageSourcePropType;
};

export const photoExamples: PhotoExample[] = [
  {
    label: 'Fernseher · Staffel 1 · Folge 5',
    source: () =>
      require('../../../assets/photo-examples/01_tv_staffel_1_folge_5.png'),
  },
  {
    label: 'Tablet · Staffel 2 · Folge 3',
    source: () =>
      require('../../../assets/photo-examples/02_tablet_staffel_2_folge_3.png'),
  },
  {
    label: 'Smartphone · Staffel 3 · Folge 8',
    source: () =>
      require('../../../assets/photo-examples/03_phone_staffel_3_folge_8.png'),
  },
  {
    label: 'Staffel abgeschlossen · Staffel 1 · Folge 10',
    source: () =>
      require('../../../assets/photo-examples/04_episode_list_staffel_1_folge_10.png'),
  },
];
