import { DOMAIN } from "@/db/enums";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DOMAIN_META } from "@/react/session-form/sessions.meta";
import { useSessionDetail } from "@/react/session-form/hooks/use-session-detail";

export function DomainSection(){
    const {
        domain,
        updateDomain,
    } = useSessionDetail();
    return (
            <Combobox 
            items={DOMAIN}
            value={domain}
            onValueChange={(d) => {
                if(d !== null) updateDomain(d);
            }}
            itemToStringLabel={(d) => DOMAIN_META[d].label}
            >
                <ComboboxInput placeholder="Search domains..."/>
                <ComboboxContent>
                    <ComboboxEmpty>No domain found.</ComboboxEmpty>
                    <ComboboxList>
                        { (d : typeof DOMAIN[number]) => {
                            const { label } = DOMAIN_META[d]
                            return (
                            <ComboboxItem key={d} value={d}>
                                {label}
                            </ComboboxItem>
                        )}}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
    )
}