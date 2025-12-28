import { React } from "@vendetta/metro/common";
import { Forms, Button, TextInput } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

const { FormText, FormItem } = Forms;

function getApi() {
  const _mods = (window as any).webpackChunkdiscord_app.push([[Symbol()], {}, (e: any) => e.c]);
  (window as any).webpackChunkdiscord_app.pop();

  const findByProps = (...props: string[]) => {
    for (const m of Object.values(_mods)) {
      try {
        if (!m?.exports || m.exports === window) continue;
        if (props.every(p => m.exports?.[p])) return m.exports;
        for (const k in m.exports) {
          if (
            props.every(p => m.exports?.[k]?.[p]) &&
            m.exports[k][Symbol.toStringTag] !== "IntlMessagesProxy"
          ) {
            return m.exports[k];
          }
        }
      } catch {}
    }
  };

  return findByProps("Jt", "tn").tn;
}

export default function Settings() {
  const [value, setValue] = React.useState("");

  const applyHouse = () => {
    const id = Number(value);
    if (![1, 2, 3].includes(id)) {
      showToast("Only values 1, 2, or 3 are allowed");
      return;
    }

    getApi().post({
      url: "/hypesquad/online",
      body: { house_id: id },
    });

    showToast(`HypeSquad set to ${id}`);
  };

  const removeHouse = () => {
    getApi().del("/hypesquad/online");
    showToast("HypeSquad removed");
  };

  return (
    <>
      <FormText>
        Select a HypeSquad house ID (1 - 3)
      </FormText>

      <FormItem title="HypeSquad ID">
        <TextInput
          value={value}
          onChange={setValue}
          placeholder="1 / 2 / 3"
          keyboardType="number-pad"
        />
      </FormItem>

      <Button text="Apply" onPress={applyHouse} />
      <Button text="Remove" color="red" onPress={removeHouse} />
    </>
  );
}

