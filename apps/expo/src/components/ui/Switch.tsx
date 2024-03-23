import type { SwitchProps } from "tamagui";
import { Switch, useTheme } from "tamagui";

const MWSwitch = (props: SwitchProps) => {
  const theme = useTheme();
  return (
    <Switch
      native
      nativeProps={{
        trackColor: {
          true: theme.switchActiveTrackColor.val,
          false: theme.switchInactiveTrackColor.val,
        },
        thumbColor: theme.switchThumbColor.val,
      }}
      {...props}
    />
  );
};

const MWSwitchThumb = (props: any) => {
  return <Switch.Thumb animation="quicker" {...props} />;
};

MWSwitch.Thumb = MWSwitchThumb;

export { MWSwitch };
