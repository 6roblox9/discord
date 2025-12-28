import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { Button } from "@vendetta/ui/components/Button";
import { showToast } from "@vendetta/ui/toasts";

const { FormText, FormItem, FormInput } = Forms;

function getApi() {
  const mods = (window as any).webpackChunkdiscord_app.push([[Symbol()], {}, (e: any) => e.c]);
  (window as any).webpackChunkdiscord_app.pop();

  const findByProps = (...props: string[]) => {
    for (const m of Object.values(mods)) {
      try {
        if (!m?.exports || m.exports === window) continue;
        if (props.every(p => m.exports?.[p])) return m.exports;
        for (const k in m.exports)
          if (
            props.every(p => m.exports?.[k]?.[p]) &&
            m.exports[k][Symbol.toStringTag] !== "IntlMessagesProxy"
          )
            return m.exports[k];
      } catch {}
    }
  };

  return findByProps("Jt", "tn").tn;
}

export default function Settings() {
  const [value, setValue] = React.useState("");

  const apply = () => {
    const id = Number(value);
    if (![1, 2, 3].includes(id)) {
      showToast("Only 1, 2 or 3 are allowed");
      return;
    }

    getApi().post({
      url: "/hypesquad/online",
      body: { house_id: id }
    });

    showToast(`HypeSquad set to ${id}`);
  };

  const remove = () => {
    getApi().del("/hypesquad/online");
    showToast("HypeSquad removed");
  };

  return (
    <>
      <FormText>Select a HypeSquad house (1 - 3)</FormText>

      <FormItem title="HypeSquad ID">
        <FormInput
          value={value}
          onChange={setValue}
          placeholder="1 / 2 / 3"
        />
      </FormItem>

      <Button text="Apply" onPress={apply} />
      <Button text="Remove" color="red" onPress={remove} />
    </>
  );
}

